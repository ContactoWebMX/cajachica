const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/advances/request
router.post('/request', async (req, res) => {
    const { user_id, amount, notes, category_id, cost_center_id, department_id, project_id, company_id } = req.body;

    // Basic validation
    if (!user_id || !amount) {
        return res.status(400).json({ error: 'User ID and Amount are required' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO advances (user_id, amount_requested, status, notes, project_id, category_id, cost_center_id, department_id, company_id, request_date, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)',
            [user_id, amount, 'Pendiente', notes, project_id || null, category_id || null, cost_center_id || null, department_id || null, company_id || null, 'Adelanto']
        );

        // --- EMAIL NOTIFICATION (New Request) ---
        try {
            const { sendNewTransactionNotification } = require('../services/emailService');
            // Get Requester Name and Manager Email
            const [users] = await db.query(
                `SELECT u.name, u.reports_to, m.email as manager_email 
                 FROM users u 
                 LEFT JOIN users m ON u.reports_to = m.id 
                 WHERE u.id = ?`,
                [user_id]
            );

            if (users.length > 0) {
                const requester = users[0];
                let recipientEmail = requester.manager_email;

                if (!recipientEmail) {
                    const [admins] = await db.query(`
                        SELECT u.email 
                        FROM users u 
                        JOIN roles r ON u.role_id = r.id 
                        WHERE r.name = 'Admin' AND u.active = 1
                    `);
                    if (admins.length > 0) recipientEmail = admins.map(a => a.email).join(',');
                }

                if (recipientEmail) {
                    // Fire and forget - do not await
                    sendNewTransactionNotification(
                        recipientEmail,
                        requester.name,
                        'Anticipo',
                        amount,
                        notes || 'Sin notas',
                        'http://localhost:5173/approvals'
                    ).catch(err => console.error('Background Email Error:', err));
                }
            }
        } catch (emailError) {
            console.error('Failed to initiate email notification:', emailError);
        }
        // ----------------------------------------

        res.status(201).json({ message: 'Advance requested successfully', id: result.insertId });
    } catch (error) {
        console.error('Advance Request Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/advances - Listar con filtros
router.get('/', async (req, res) => {
    const { user_id, status, start_date, end_date, search, exclude_depleted, include_reports } = req.query;
    try {
        // Consulta base incuyendo el nombre del usuario y el monto utilizado
        // Se calcula 'used_amount' sumando los gastos asociados a este anticipo que NO estén rechazados.
        // COALESCE asegura que si no hay gastos, retorne 0 en lugar de null.
        let query = `
            SELECT a.*, u.name as user_name,
            c.name as category_name, cc.name as cost_center_name, d.name as department_name, p.name as project, co.name as company_name,
            (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE advance_id = a.id AND status = 'Pagado') as used_amount
            FROM advances a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN expense_categories c ON a.category_id = c.id
            LEFT JOIN cost_centers cc ON a.cost_center_id = cc.id
            LEFT JOIN departments d ON a.department_id = d.id
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN companies co ON a.company_id = co.id
        `;
        const params = [];
        const conditions = [];

        if (user_id) {
            if (include_reports === 'true') {
                conditions.push('(a.user_id = ? OR u.reports_to = ?)');
                params.push(user_id, user_id);
            } else {
                conditions.push('a.user_id = ?');
                params.push(user_id);
            }
        }

        if (status && status !== 'All') {
            conditions.push('a.status = ?');
            params.push(status);
        }

        if (start_date) {
            conditions.push('a.request_date >= ?');
            params.push(start_date);
        }

        if (end_date) {
            conditions.push('a.request_date <= ?');
            // Asumiendo que end_date incluye tiempo o se maneja ampliamente
            params.push(end_date);
        }

        if (search) {
            conditions.push('(a.notes LIKE ? OR a.amount_requested LIKE ? OR u.name LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Filtro para excluir anticipos agotados
        // Se aplica si el parámetro exclude_depleted es 'true'
        if (exclude_depleted === 'true') {
            // La condición asegura que el monto aprobado sea MAYOR que el monto utilizado.
            // Es decir, aún queda saldo disponible.
            // Nota: amount_approved debe ser usado, no amount_requested, ya que es el real autorizado.
            conditions.push('(a.amount_approved > (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE advance_id = a.id AND status = "Pagado"))');
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY a.request_date DESC';

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener anticipos:', error);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});


// GET /api/advances/balance/:userId
router.get('/balance/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // 1. Get total approved advances (Adelantos and Devoluciones)
        const [advances] = await db.execute(
            `SELECT COALESCE(SUM(amount_approved), 0) as total_advances 
             FROM advances 
             WHERE user_id = ? AND type IN ('Adelanto', 'Devolucion') AND status IN ('Pagado', 'Comprobado')`, // Only Pagado/Comprobado!
            [userId]
        );

        // 2. Get total expenses linked to advances (Consuming the advance) - For Balance Calculation
        const [expenses] = await db.execute(
            `SELECT COALESCE(SUM(amount), 0) as total_expenses 
             FROM expenses 
             WHERE user_id = ? AND status IN ('Aprobado', 'Pagado', 'Comprobado')`,
            [userId]
        );

        // 3. Get total PROVEN expenses (Status Approved/Paid/Comprobado) - For Display "Gastos Comprobados"
        // This includes ALL expenses, whether linked to an advance or not (Reimbursements)
        const [provenExpenses] = await db.execute(
            `SELECT COALESCE(SUM(amount), 0) as total_proven 
             FROM expenses 
             WHERE user_id = ? AND status IN ('Aprobado', 'Pagado', 'Comprobado')`,
            [userId]
        );

        // 4. Get total REIMBURSEMENTS (Advances of type 'Reembolso' that are Approved/Paid)
        const [reimbursements] = await db.execute(
            `SELECT COALESCE(SUM(amount_approved), 0) as total_reimbursements
             FROM advances
             WHERE user_id = ? AND type = 'Reembolso' AND status IN ('Pagado', 'Comprobado')`,
            [userId]
        );

        const totalAdvances = parseFloat(advances[0].total_advances);
        const totalExpenses = parseFloat(expenses[0].total_expenses);
        const totalProven = parseFloat(provenExpenses[0].total_proven);
        const totalReimbursements = parseFloat(reimbursements[0].total_reimbursements);

        // Balance includes advances and formal reimbursements vs total expenses
        const balance = (totalAdvances + totalReimbursements) - totalExpenses;

        res.json({
            user_id: userId,
            total_advances: totalAdvances,
            total_expenses: totalExpenses,
            total_proven_expenses: totalProven,
            total_reimbursements: totalReimbursements,
            balance: balance
        });

    } catch (error) {
        console.error('Balance Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/advances/detail/:id - Obtener detalle de un anticipo/reembolso específico
router.get('/detail/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT a.*, u.name as user_name, co.name as company_name,
                   SUM(CASE WHEN e.status = 'Pagado' THEN COALESCE(e.amount, 0) ELSE 0 END) as used_amount,
                   CASE WHEN COUNT(e.id) > 0 AND SUM(CASE WHEN e.status = 'Pagado' THEN COALESCE(e.amount, 0) ELSE 0 END) >= a.amount_approved THEN "Comprobado" ELSE a.status END as calculated_status
            FROM advances a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN expenses e ON a.id = e.advance_id
            LEFT JOIN companies co ON a.company_id = co.id
            WHERE a.id = ?
            GROUP BY a.id, co.name
        `;
        const [rows] = await db.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener detalle de anticipo:', error);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});

// PUT /api/advances/:id/approve
router.put('/:id/approve', async (req, res) => {
    const { id } = req.params;
    const { status, amount_approved, notes, manager_id } = req.body; // status: 'Aprobado' | 'Rechazado'

    if (!['Aprobado', 'Rechazado', 'Pagado'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        let newStatus = status;

        if (status === 'Aprobado') {
            // 1. Get Current Status and Type to check if it's already escalated
            const [advanceRows] = await db.query('SELECT status, type FROM advances WHERE id = ?', [id]);
            const currentStatus = advanceRows.length > 0 ? advanceRows[0].status : 'Pendiente';
            const advanceType = advanceRows.length > 0 ? advanceRows[0].type : 'Anticipo';

            // 2. Get Min Amount Setting
            const [settings] = await db.query('SELECT setting_value FROM app_settings WHERE setting_key = "APPROVAL_MIN_AMOUNT"');
            const minAmount = settings.length > 0 ? parseFloat(settings[0].setting_value) : 1000;

            // 3. Check Amount & Logic
            const amountToCheck = parseFloat(amount_approved || 0);

            if (currentStatus === 'Aprobado Jefe') {
                newStatus = 'Aprobado Director'; // Director is approving
            } else if (currentStatus === 'Pendiente') {
                // If it is a Reembolso, it MUST skip the Manager
                if (advanceType === 'Reembolso') {
                    newStatus = 'Aprobado Director';
                } else {
                    newStatus = 'Aprobado Jefe';
                }
            } else {
                return res.status(400).json({ error: 'Estado actual no permite esta aprobación.' });
            }
        } else if (status === 'Pagado') {
            // Ensure it was Aprobado first
            const [advanceRows] = await db.query('SELECT status FROM advances WHERE id = ?', [id]);
            const currentStatus = advanceRows.length > 0 ? advanceRows[0].status : 'Pendiente';
            if (currentStatus !== 'Aprobado Director') {
                return res.status(400).json({ error: 'Debe estar Aprobado por el Director antes del pago.' });
            }
            newStatus = 'Pagado';
        }

        // Fetch approver name if someone is approving it
        let approverName = null;
        if (manager_id && (newStatus === 'Aprobado Director' || newStatus === 'Aprobado' || newStatus === 'Aprobado Jefe')) {
            const [mgrData] = await db.query('SELECT name FROM users WHERE id = ?', [manager_id]);
            if (mgrData.length > 0) approverName = mgrData[0].name;
        }

        // Update status, approved amount, action date, notes, and rejection reason, and approver_name

        let queryStr = 'UPDATE advances SET status = ?, amount_approved = ?, action_date = NOW(), notes = ?, rejection_reason = ?';
        let queryParams = [newStatus, amount_approved || 0, notes || '', req.body.rejection_reason || null];

        if (approverName) {
            queryStr += ', approver_name = ?';
            queryParams.push(approverName);
        }

        queryStr += ' WHERE id = ?';
        queryParams.push(id);

        await db.execute(queryStr, queryParams);

        // --- EMAIL NOTIFICATION (Status Update) ---
        try {
            const { sendStatusUpdateNotification } = require('../services/emailService');
            // Get Requester Email
            const [advances] = await db.query(
                `SELECT a.user_id, u.email 
                 FROM advances a 
                 JOIN users u ON a.user_id = u.id 
                 WHERE a.id = ?`,
                [id]
            );

            if (advances.length > 0) {
                const recipientEmail = advances[0].email;
                if (recipientEmail) {
                    sendStatusUpdateNotification(
                        recipientEmail,
                        'Anticipo',
                        newStatus,
                        notes || req.body.rejection_reason || ''
                    ).catch(err => console.error('Background Email Error:', err));
                }
            }
        } catch (emailError) {
            console.error('Failed to initiate status email:', emailError);
        }
        // ------------------------------------------

        res.json({ message: `Advance updated to ${newStatus}` });
    } catch (error) {
        console.error('Advance Approval Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/advances/reimburse - Settle negative balance
router.post('/reimburse', async (req, res) => {
    const { user_id, notes, admin_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // 1. Calculate current balance to confirm negative
        // Reuse logic from /balance/:userId or just calc here
        const [advances] = await db.execute(
            `SELECT COALESCE(SUM(amount_approved), 0) as total 
             FROM advances 
             WHERE user_id = ? AND status IN ('Aprobado', 'Comprobado', 'Pagado')`, [user_id]
        );
        const [expenses] = await db.execute(
            `SELECT COALESCE(SUM(amount), 0) as total 
             FROM expenses 
             WHERE user_id = ? AND status IN ('Aprobado', 'Pagado', 'Comprobado')`, [user_id]
        );

        const balance = parseFloat(advances[0].total) - parseFloat(expenses[0].total);

        if (balance >= 0) {
            return res.status(400).json({ error: 'User does not have a negative balance' });
        }

        // Check for existing pending/approved reimbursements that haven't been paid yet
        const [pendingReimbursements] = await db.execute(
            `SELECT COALESCE(SUM(amount_requested), 0) as total_pending
             FROM advances 
             WHERE user_id = ? AND type = 'Reembolso' AND status IN ('Pendiente', 'Aprobado', 'Pendiente Dirección')`,
            [user_id]
        );

        const totalPending = parseFloat(pendingReimbursements[0].total_pending);

        // If current balance + pending reimbursements >= 0, then we don't need another request
        // e.g. Balance -5000, Pending +5000 => Result 0. No new request needed.
        // e.g. Balance -5000, Pending +2000 => Result -3000. Could theoretically request 3000, but logic simplifies to "Active Request Exists".

        if (totalPending > 0 && (balance + totalPending >= 0)) {
            return res.status(400).json({ error: 'Ya existe una solicitud en proceso que cubre el saldo actual.' });
        }

        const amountToReimburse = Math.abs(balance);

        // 2. Create "Advance" as Reimbursement Request
        // Status 'Pendiente' so manager must approve it.
        const [result] = await db.execute(
            'INSERT INTO advances (user_id, amount_requested, status, notes, project, request_date, type) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
            [
                user_id,
                amountToReimburse,
                'Aprobado Jefe', // Salta al Jefe y va directo al Director
                notes || 'Solicitud de Reembolso de Gastos',
                'Finance Settlement',
                'Reembolso'
            ]
        );

        // 3. Log it
        // ...

        res.json({ message: 'Reimbursement processed', amount: amountToReimburse, id: result.insertId });

    } catch (error) {
        console.error('Reimbursement Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
