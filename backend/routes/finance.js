const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper to calculate system balance for a user
const calculateSystemBalance = async (userId) => {
    // Logic: Total approved advances - Total approved expenses (that are not yet reimbursed/liquidated)
    // For simplicity, we assume:
    // Balance = All 'Activso' Advances - All 'Approved' Expenses linked to those advances or generally pending reimbursement
    // Let's refine based on existing schema:
    // advance.status = 'Aprobado' (Money given to user)
    // expense.status = 'Aprobado' (Money spent by user)

    // Get total approved advances (Adelantos and Devoluciones)
    const [advances] = await db.query(
        'SELECT COALESCE(SUM(amount_approved), 0) as total FROM advances WHERE user_id = ? AND type IN ("Adelanto", "Devolucion") AND status IN ("Pagado", "Comprobado")',
        [userId]
    );

    // Get total approved expenses
    const [expenses] = await db.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND status IN ("Aprobado", "Pagado", "Comprobado")',
        [userId]
    );

    const totalAdvances = parseFloat(advances[0].total);
    const totalExpenses = parseFloat(expenses[0].total);

    // To get the true reconciliation balance, we calculate PER ADVANCE.
    const [advanceBalances] = await db.query(`
        SELECT 
            a.id, 
            a.amount_approved, 
            COALESCE(SUM(e.amount), 0) as spent
        FROM advances a
        LEFT JOIN expenses e ON e.advance_id = a.id AND e.status IN ('Aprobado', 'Pagado', 'Comprobado')
        WHERE a.user_id = ? AND a.type IN ('Adelanto', 'Devolucion') AND a.status IN ('Pagado', 'Comprobado')
        GROUP BY a.id, a.amount_approved
    `, [userId]);

    let user_unproven_balance = 0;
    let user_debt = 0;

    advanceBalances.forEach(adv => {
        const bal = parseFloat(adv.amount_approved) - parseFloat(adv.spent);
        if (bal > 0) user_unproven_balance += bal;
        else if (bal < 0) user_debt += Math.abs(bal);
    });

    // Add Direct Expenses to user debt ONLY if they have been finalized by the Director ('Aprobado Director')
    const [directPaidExpenses] = await db.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND status = "Aprobado Director" AND advance_id IS NULL',
        [userId]
    );
    const totalDirectPaid = parseFloat(directPaidExpenses[0].total);
    user_debt += totalDirectPaid;

    // Subtract Reimbursements from user debt
    const [reimbursements] = await db.query(
        'SELECT COALESCE(SUM(amount_approved), 0) as total FROM advances WHERE user_id = ? AND type = "Reembolso" AND status IN ("Pagado", "Comprobado")',
        [userId]
    );
    const totalReimbursements = parseFloat(reimbursements[0].total);
    user_debt -= totalReimbursements;
    if (user_debt < 0) user_debt = 0; // Prevent negative debt meaning they owe company outside of an advance.

    // Calculate Personal Net Balance (positive means they owe company, negative means company owes them)
    const personalNetBalance = (totalAdvances + totalReimbursements + totalDirectPaid) - totalExpenses;

    return {
        totalAdvances,
        totalExpenses,
        totalReimbursements,
        balance: personalNetBalance,
        unproven_funds: user_unproven_balance,
        debt_to_employee: user_debt
    };
};

// GET /api/finance/stats
router.get('/stats', async (req, res) => {
    const userId = req.query.user_id; // Or from session if middleware used
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    try {
        // Also get Global Cash Balance (Replenishments - Outflows)
        // 1. Total Replenishments
        const [inflows] = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM cash_flows WHERE type = "ingreso"');
        const totalInflows = parseFloat(inflows[0].total);

        // 2. Total Outflows (Approved Advances + Approved Expenses NOT reimbursed)
        // Cash Out = All Advances net + Direct Expenses paid from caja.
        const [advanceOut] = await db.query('SELECT COALESCE(SUM(amount_approved), 0) as total FROM advances WHERE status IN ("Pagado", "Comprobado")');
        const [directExpenseOut] = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = "Pagado" AND advance_id IS NULL');
        const totalOutflows = parseFloat(advanceOut[0].total) + parseFloat(directExpenseOut[0].total);

        const globalBalance = totalInflows - totalOutflows;

        // Global Advances (Adelanto and Devoluciones net)
        const [globalAdvancesRes] = await db.query(
            `SELECT COALESCE(SUM(amount_approved), 0) as total FROM advances WHERE type IN ('Adelanto', 'Devolucion') AND status IN ('Pagado', 'Comprobado')`
        );
        const global_total_advances = parseFloat(globalAdvancesRes[0].total);

        // Global Proven Expenses
        const [globalExpensesRes] = await db.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status IN ('Aprobado', 'Pagado', 'Comprobado')`
        );
        const global_total_proven_expenses = parseFloat(globalExpensesRes[0].total);

        // Global Reimbursements
        const [globalReimbRes] = await db.query(
            `SELECT COALESCE(SUM(amount_approved), 0) as total FROM advances WHERE type = 'Reembolso' AND status IN ('Pagado', 'Comprobado')`
        );
        const global_total_reimbursements = parseFloat(globalReimbRes[0].total);

        // Global Direct Paid Expenses
        const [globalDirectRes] = await db.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 'Pagado' AND advance_id IS NULL`
        );
        const global_total_direct = parseFloat(globalDirectRes[0].total);

        // PER-ADVANCE AGGREGATION to prevent cross-cancelation between trips or employees
        const [advanceBalances] = await db.query(`
            SELECT 
                a.id, 
                a.amount_approved, 
                COALESCE(SUM(e.amount), 0) as spent
            FROM advances a
            LEFT JOIN expenses e ON e.advance_id = a.id AND e.status IN ('Aprobado', 'Pagado', 'Comprobado')
            WHERE a.type IN ('Adelanto', 'Devolucion') AND a.status IN ('Pagado', 'Comprobado')
            GROUP BY a.id, a.amount_approved
        `);

        let gross_unproven_balance = 0;
        let gross_employee_debt = 0;

        advanceBalances.forEach(adv => {
            const bal = parseFloat(adv.amount_approved) - parseFloat(adv.spent);
            if (bal > 0) gross_unproven_balance += bal;
            else if (bal < 0) gross_employee_debt += Math.abs(bal);
        });

        // Add ONLY pending direct expenses definitively approved by the Director to the debt pool
        const [directRes] = await db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE advance_id IS NULL AND status = 'Aprobado Director'`);
        gross_employee_debt += parseFloat(directRes[0].total);

        // Subtract ALL formal Reimbursements from debt pool (cash given back to employees)
        const [reimbRes] = await db.query(`SELECT COALESCE(SUM(amount_approved), 0) as total FROM advances WHERE type = 'Reembolso' AND status IN ('Pagado', 'Comprobado')`);
        const totalReimbursements = parseFloat(reimbRes[0].total);
        gross_employee_debt -= totalReimbursements;

        const global_unproven_balance = gross_unproven_balance;
        const global_employee_debt = gross_employee_debt > 0 ? gross_employee_debt : 0;

        const stats = await calculateSystemBalance(userId);
        res.json({
            ...stats,
            global_balance: globalBalance,
            global_total_advances,
            global_total_proven_expenses,
            global_total_reimbursements,
            global_unproven_balance,
            global_employee_debt
        });
    } catch (error) {
        console.error('Error fetching finance stats:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/finance/debts
router.get('/debts', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email FROM users WHERE active = true');
        const debts = [];

        for (const user of users) {
            const userId = user.id;

            // Re-use logic from calculateSystemBalance to ensure precision
            const [advanceBalances] = await db.query(`
                SELECT 
                    a.id, 
                    a.amount_approved, 
                    COALESCE(SUM(e.amount), 0) as spent
                FROM advances a
                LEFT JOIN expenses e ON e.advance_id = a.id AND e.status IN ('Aprobado', 'Pagado', 'Comprobado')
                WHERE a.user_id = ? AND a.type IN ('Adelanto', 'Devolucion') AND a.status IN ('Pagado', 'Comprobado')
                GROUP BY a.id, a.amount_approved
            `, [userId]);

            let user_debt = 0;
            advanceBalances.forEach(adv => {
                const bal = parseFloat(adv.amount_approved) - parseFloat(adv.spent);
                if (bal < 0) user_debt += Math.abs(bal);
            });

            // Add ALL Direct Expenses to user debt
            const [directPaidExpenses] = await db.query(
                'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND status IN ("Aprobado", "Pagado", "Comprobado") AND advance_id IS NULL',
                [userId]
            );
            user_debt += parseFloat(directPaidExpenses[0].total);

            // Subtract ALL prior formal Reimbursements from user debt
            const [reimbursements] = await db.query(
                'SELECT COALESCE(SUM(amount_approved), 0) as total FROM advances WHERE user_id = ? AND type = "Reembolso" AND status IN ("Pagado", "Comprobado")',
                [userId]
            );
            user_debt -= parseFloat(reimbursements[0].total);
            if (user_debt < 0) user_debt = 0;

            if (user_debt > 0) {
                debts.push({
                    user_id: user.id,
                    user_name: user.name,
                    user_email: user.email,
                    debt_amount: user_debt
                });
            }
        }

        res.json(debts);
    } catch (error) {
        console.error('Error fetching debts:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/finance/pay-debt
router.post('/pay-debt', async (req, res) => {
    const { user_id, amount, notes, cashier_id } = req.body;

    if (!user_id || typeof amount === 'undefined') {
        return res.status(400).json({ error: 'User ID and amount required' });
    }

    try {
        await db.query('BEGIN');

        // 1. Calculate how much of the debt comes from direct expenses
        const [directRes] = await db.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND status = "Aprobado" AND advance_id IS NULL',
            [user_id]
        );
        const directToPay = parseFloat(directRes[0].total);

        // 2. Register the physical cash outflow in the ledger
        await db.execute(
            'INSERT INTO cash_flows (type, amount, description, user_id, date) VALUES (?, ?, ?, ?, NOW())',
            ['egreso', amount, `Pago de Saldo a Favor: ${notes || 'Reembolso'}`, cashier_id || user_id]
        );

        // 3. Mark ALL pending approved expenses as Pagado 
        // This clears the Cashier's pending queue so they don't manually pay them later and duplicate outflow.
        await db.execute(
            'UPDATE expenses SET status = "Pagado" WHERE user_id = ? AND status = "Aprobado"',
            [user_id]
        );

        // 4. Calculate if we need to insert a formal 'Reembolso' record.
        // We only insert a Reembolso for the portion of the debt that comes from overdrawn advances.
        // If amount = 500, and directToPay = 300, we need a Reembolso of 200 to perfectly balance the math.
        const amountToReimburse = amount - directToPay;

        let advanceId = null;
        if (amountToReimburse > 0) {
            const [result] = await db.execute(
                `INSERT INTO advances (user_id, amount_requested, amount_approved, status, type, notes, request_date) 
                 VALUES (?, ?, ?, 'Pagado', 'Reembolso', ?, NOW())`,
                [user_id, amountToReimburse, amountToReimburse, notes || 'Reembolso compensatorio por diferencia de anticipos']
            );
            advanceId = result.insertId;
        }

        await db.query('COMMIT');
        res.status(201).json({ message: 'Debt paid successfully', advance_id: advanceId, direct_paid: directToPay, reimbursement: amountToReimburse });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error paying debt:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/finance/replenish
router.post('/replenish', async (req, res) => {
    console.log('POST /replenish payload:', req.body);
    const { amount, description, user_id } = req.body;

    if (!amount || user_id === undefined || user_id === null) {
        return res.status(400).json({ error: 'Amount and User ID required' });
    }

    try {
        await db.execute(
            'INSERT INTO cash_flows (type, amount, description, user_id, date) VALUES (?, ?, ?, ?, NOW())',
            ['ingreso', amount, description || 'Reposición de Caja', user_id]
        );
        res.status(201).json({ message: 'Cash replenished successfully' });
    } catch (error) {
        console.error('Replenishment Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/finance/replenishments
router.get('/replenishments', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT cf.*, u.name as user_name 
             FROM cash_flows cf
             LEFT JOIN users u ON cf.user_id = u.id
             WHERE cf.type = 'ingreso' 
             ORDER BY cf.date DESC 
             LIMIT 10`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching replenishments:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/finance/reconciliate
router.post('/reconciliate', async (req, res) => {
    const { user_id, total_physical, denominations, notes } = req.body;

    if (!user_id || total_physical === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Calculate Global Balance for Reconciliation (Main Cash Box)
        // 1. Total Replenishments
        const [inflows] = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM cash_flows WHERE type = "ingreso"');
        const totalInflows = parseFloat(inflows[0].total);

        // 2. Total Outflows
        const [advanceOut] = await db.query('SELECT COALESCE(SUM(amount_approved), 0) as total FROM advances WHERE status IN ("Pagado", "Comprobado")');
        const [directExpenseOut] = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = "Pagado" AND advance_id IS NULL');
        const totalOutflows = parseFloat(advanceOut[0].total) + parseFloat(directExpenseOut[0].total);

        const globalBalance = totalInflows - totalOutflows;
        const total_system = globalBalance;

        // Ensure numbers
        const physical = parseFloat(total_physical);
        const system = parseFloat(total_system);
        const difference = physical - system;

        const status = Math.abs(difference) < 0.01 ? 'Cerrado' : 'Pendiente';

        const [result] = await db.execute(
            `INSERT INTO reconciliations
                    (user_id, total_system, total_physical, difference, status, notes, denominations) 
            VALUES(?, ?, ?, ?, ?, ?, ?)`,
            [user_id, system, physical, difference, status, notes || null, JSON.stringify(denominations)]
        );

        res.status(201).json({
            message: 'Reconciliation saved',
            id: result.insertId,
            difference,
            status
        });

    } catch (error) {
        console.error('Error saving reconciliation:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/finance/history
router.get('/history', async (req, res) => {
    console.log('Finance: GET /history called');
    const userId = req.query.user_id;
    try {
        let query = 'SELECT * FROM reconciliations';
        let params = [];

        if (userId) {
            query += ' WHERE user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY date DESC LIMIT 50';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/finance/export/netsuite
router.get('/export/netsuite', async (req, res) => {
    const { start_date, end_date } = req.query;

    try {
        // Fetch expenses within date range
        // Join with categories/cost_centers for names
        const [expenses] = await db.query(`
            SELECT e.*,
            u.name as user_name,
            c.name as category,
            cc.code as cost_center_code,
            cc.name as cost_center_name
            FROM expenses e
            JOIN users u ON e.user_id = u.id
            LEFT JOIN expense_categories c ON e.category_id = c.id
            LEFT JOIN cost_centers cc ON e.cost_center_id = cc.id
            WHERE e.date BETWEEN ? AND ?
            AND e.status = 'Aprobado'
            ORDER BY e.date ASC
        `, [start_date || '2000-01-01', end_date || '2100-12-31']);

        if (expenses.length === 0) {
            return res.status(404).json({ error: 'No data to export' });
        }

        // CSV Header for NetSuite (Simplified Journal Entry format)
        // External ID, Date, Memo, Account, Debit, Credit, Entity, Department, Class, Location
        let csvContent = 'ExternalID,Date,Memo,Account,Debit,Credit,Entity,Department,Class,Location\n';

        expenses.forEach(exp => {
            const dateStr = new Date(exp.date).toISOString().split('T')[0];
            const memo = `Exp: ${exp.description || ''} (${exp.category})`;
            const account = getAccountCode(exp.category); // Placeholder helper

            // Debit Line (Expense)
            csvContent += `${exp.id},${dateStr}, "${memo}", ${account},${exp.amount}, 0, "${exp.user_name}", "${exp.cost_center_code}", "${exp.category}", "Main"\n`;

            // Credit Line (Cash/Bank) - simplified 1:1, usually aggregated
            csvContent += `${exp.id},${dateStr}, "${memo}", "1110-CASH", 0, ${exp.amount}, "${exp.user_name}", "${exp.cost_center_code}", "${exp.category}", "Main"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`netsuite_export_${new Date().getTime()}.csv`);
        res.send(csvContent);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Helper for account mapping (mock)
function getAccountCode(categoryName) {
    const mapping = {
        'Viáticos': '6001',
        'Papelería': '6002',
        'Transporte': '6003',
        'Alimentos': '6004'
    };
    return mapping[categoryName] || '6999-MISC';
}

module.exports = router;
