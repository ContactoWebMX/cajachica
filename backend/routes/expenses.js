const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/expenses';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/expenses/:id/pay - Pay out a single direct expense
router.post('/:id/pay', async (req, res) => {
    const { id } = req.params;
    const { cashier_id } = req.body;

    try {
        await db.query('BEGIN');

        // 1. Verify expense exists and is 'Aprobado Director' (final approval for cashier action)
        const [expenses] = await db.execute(
            'SELECT * FROM expenses WHERE id = ? AND status = "Aprobado Director" FOR UPDATE',
            [id]
        );

        if (expenses.length === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: 'Expense is not eligible for payout/reconciliation or does not exist.' });
        }

        const expense = expenses[0];

        // 2. Mark expense as 'Pagado'
        await db.execute('UPDATE expenses SET status = "Pagado" WHERE id = ?', [id]);

        // 3. Register cash outflow in the ledger ONLY if it is a direct out-of-pocket expense
        if (!expense.advance_id) {
            const cashDescription = `Reembolso de ticket #${expense.folio || expense.id}: ${expense.description}`;
            await db.execute(
                'INSERT INTO cash_flows (type, amount, description, user_id, date) VALUES (?, ?, ?, ?, NOW())',
                ['reembolso', expense.amount, cashDescription, cashier_id || expense.user_id]
            );
        }

        // 4. System Log
        const actionType = expense.advance_id ? 'COMPROBAR' : 'REIMBURSE';
        const logAction = expense.advance_id ? `Reconciled $${expense.amount}` : `Paid $${expense.amount}`;

        await db.execute(
            'INSERT INTO system_logs (user_id, action, entity, entity_id, new_value) VALUES (?, ?, ?, ?, ?)',
            [cashier_id || expense.user_id, actionType, 'Expense', id, JSON.stringify({ action: logAction })]
        );

        await db.query('COMMIT');
        res.json({ message: expense.advance_id ? 'Expense reconciled successfully' : 'Expense reimbursed successfully', amount: expense.amount });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Pay Expense Error:', error);
        res.status(500).json({ error: 'Database error while reimbursing expense' });
    }
});

// POST /api/expenses
router.post('/', upload.single('file'), async (req, res) => {
    let {
        user_id,
        amount,
        description,
        date,
        rfc,
        folio,
        geo_lat,
        geo_long,
        file_hash, // Client might send hash, or we calc it server side. Ignoring for now or taking from body.
        advance_id,
        category_id,
        cost_center_id,
        custom_data,
        project_id,
        status,
        company_id,
        department_id
    } = req.body;

    const file_path = req.file ? req.file.path : null;

    // Parse numeric fields (multipart sends strings)
    let parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) parsedAmount = 0.00;

    user_id = parseInt(user_id);
    if (advance_id) advance_id = parseInt(advance_id);
    if (category_id) category_id = parseInt(category_id);
    if (cost_center_id) cost_center_id = parseInt(cost_center_id);
    if (company_id) company_id = parseInt(company_id);
    if (department_id) department_id = parseInt(department_id);

    // Initial check for required fields - Amount must be valid number, but we defaulted to 0. 
    // If strict validation needed: if (!amount || isNaN(parsedAmount)) return error.
    if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // 1. Duplicate Check (RFC + Folio)
    if (rfc && folio) {
        try {
            const [existing] = await db.execute(
                'SELECT id FROM expenses WHERE rfc = ? AND folio = ?',
                [rfc, folio]
            );
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Duplicate expense detected (RFC + Folio match)' }); // 409 Conflict
            }
        } catch (error) {
            console.error('Duplicate Check Error:', error);
            return res.status(500).json({ error: 'Database error during duplicate check' });
        }
    }

    // 2. Inheritance & Deduct from Advance Logic
    if (advance_id) {
        try {
            const [advance] = await db.execute(
                'SELECT project_id, category_id, company_id, cost_center_id, department_id FROM advances WHERE id = ? AND user_id = ? AND status IN ("Aprobado", "Comprobado", "Pendiente", "Pagado")',
                [advance_id, user_id]
            );
            if (advance.length === 0) {
                return res.status(400).json({ error: 'Invalid or inactive advance selected' });
            }
            // OVERRIDE classification with Advance data to ensure consistency
            const adv = advance[0];
            project_id = adv.project_id || project_id;
            category_id = adv.category_id || category_id;
            company_id = adv.company_id || company_id;
            cost_center_id = adv.cost_center_id || cost_center_id;
            department_id = adv.department_id || department_id;

        } catch (error) {
            console.error('Advance Validation Error:', error);
            return res.status(500).json({ error: 'Database error during advance validation' });
        }
    }

    // ... (previous code)

    // 3. Create Expense
    try {
        // OPTIMIZATION: If expense is linked to an advance, it's pre-authorized by the initial request.
        // It goes directly to 'Aprobado Director' so it appears on the Cashier's task list immediately.
        let expenseStatus = status || 'Pendiente';
        if (advance_id) {
            expenseStatus = 'Aprobado Director';
        }

        const [result] = await db.execute(
            `INSERT INTO expenses 
            (user_id, amount, description, date, status, custom_data, file_path, file_hash, rfc, folio, geo_lat, geo_long, advance_id, category_id, cost_center_id, project_id, company_id, department_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                parsedAmount,
                description,
                (date || new Date().toISOString()).slice(0, 19).replace('T', ' '), // Fix date format
                expenseStatus,
                JSON.stringify(custom_data || {}),
                file_path || null,
                file_hash || null,
                rfc || null,
                folio || null,
                geo_lat || null,
                geo_long || null,
                advance_id || null,
                category_id || null,
                cost_center_id || null,
                project_id || null,
                company_id || null,
                department_id || null
            ]
        );

        // 4. Create Log
        await db.execute(
            'INSERT INTO system_logs (user_id, action, entity, entity_id, new_value) VALUES (?, ?, ?, ?, ?)',
            [user_id, 'CREATE', 'Expense', result.insertId, JSON.stringify(req.body)]
        );

        // --- EMAIL NOTIFICATION ---
        try {
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

                // LOGIC CHANGE: If auto-approved (advance_id present), notify Admins/Cashiers directly
                // Skip manager as they already authorized the initial advance.
                if (advance_id) {
                    recipientEmail = null; // Force admin/cashier notification
                }

                // If no manager (or auto-approved), notify Admins/Cashiers
                if (!recipientEmail) {
                    const [admins] = await db.query(`
                        SELECT u.email 
                        FROM users u 
                        JOIN roles r ON u.role_id = r.id 
                        WHERE r.name IN ('Admin', 'Cajero') AND u.active = 1
                    `);
                    if (admins.length > 0) {
                        recipientEmail = admins.map(a => a.email).join(',');
                    }
                }

                if (recipientEmail) {
                    const { sendNewTransactionNotification } = require('../services/emailService');
                    const link = advance_id ? 'http://localhost:5173/transactions' : 'http://localhost:5173/approvals';
                    const typeLabel = advance_id ? 'Comprobación de Anticipo' : 'Gasto Directo';

                    sendNewTransactionNotification(
                        recipientEmail,
                        requester.name,
                        typeLabel,
                        parsedAmount,
                        description,
                        link
                    ).catch(err => console.error('Background Email Error:', err));
                }
            }
        } catch (emailError) {
            console.error('Failed to initiate email notification:', emailError);
            // Don't fail the request if email fails
        }
        // ---------------------------

        // 5. Handle Cash Return (Devolución) if present
        if (req.body.return_amount) {
            const returnAmount = parseFloat(req.body.return_amount);
            if (returnAmount > 0) {
                // ... (rest of logic)
                await db.execute(
                    'INSERT INTO advances (user_id, amount_requested, amount_approved, status, notes, project_id, request_date, type) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)',
                    [
                        user_id,
                        -returnAmount, // Requesting negative
                        -returnAmount, // Approved negative (will be effective when status becomes Pagado)
                        'Pendiente',
                        `Devolución de remanente (Gasto #${result.insertId})`,
                        null,
                        'Devolucion'
                    ]
                );
            }
        }

        res.status(201).json({ message: 'Expense created successfully', id: result.insertId });

    } catch (error) {
        console.error('Create Expense Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /api/expenses/:id - Update Expense
router.put('/:id', upload.single('file'), async (req, res) => {
    const { id } = req.params;
    let {
        amount,
        description,
        date,
        rfc,
        folio,
        category_id,
        cost_center_id,
        project_id,
        advance_id,
        user_id, // Optional validation to ensure owner
        company_id,
        department_id
    } = req.body;

    try {
        // 1. Check if expense exists and is 'Pendiente'
        const [existing] = await db.execute('SELECT status, user_id, file_path FROM expenses WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Expense not found' });

        const expense = existing[0];
        if (expense.status !== 'Pendiente') {
            return res.status(403).json({ error: 'Only pending expenses can be edited' });
        }

        // 2. Prepare updates
        const params = [];
        let query = 'UPDATE expenses SET ';
        const updates = [];

        if (amount) { updates.push('amount = ?'); params.push(parseFloat(amount)); }
        if (description) { updates.push('description = ?'); params.push(description); }
        if (date) { updates.push('date = ?'); params.push(date); }
        if (rfc) { updates.push('rfc = ?'); params.push(rfc); }
        if (folio) { updates.push('folio = ?'); params.push(folio); }
        if (category_id) { updates.push('category_id = ?'); params.push(category_id); }
        if (cost_center_id) { updates.push('cost_center_id = ?'); params.push(cost_center_id); }
        if (project_id) { updates.push('project_id = ?'); params.push(project_id); }
        if (advance_id) {
            updates.push('advance_id = ?');
            params.push(advance_id);
            // Also auto-approve if linked during edit
            updates.push('status = ?');
            params.push('Aprobado Director');
        }
        if (company_id) { updates.push('company_id = ?'); params.push(company_id); }
        if (department_id) { updates.push('department_id = ?'); params.push(department_id); }

        // Handle File Update
        if (req.file) {
            updates.push('file_path = ?');
            params.push(req.file.path);

            // Optional: delete old file? Keeping simple for now.
        }

        if (updates.length === 0) return res.json({ message: 'No changes detected' });

        query += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        await db.execute(query, params);

        res.json({ message: 'Expense updated successfully' });

    } catch (error) {
        console.error('Update Expense Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/', async (req, res) => {
    const { user_id, start_date, end_date, status, search, include_reports } = req.query;

    try {
        let query = `
            SELECT e.*, c.name as category_name, cc.name as cost_center_name, u.name as user_name, p.name as project, co.name as company_name
            FROM expenses e
            LEFT JOIN expense_categories c ON e.category_id = c.id
            LEFT JOIN cost_centers cc ON e.cost_center_id = cc.id
            LEFT JOIN projects p ON e.project_id = p.id
            LEFT JOIN companies co ON e.company_id = co.id
            LEFT JOIN users u ON e.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (user_id) {
            if (include_reports === 'true') {
                query += ' AND (e.user_id = ? OR u.reports_to = ?)';
                params.push(user_id, user_id);
            } else {
                query += ' AND e.user_id = ?';
                params.push(user_id);
            }
        }

        if (start_date) {
            query += ' AND e.date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND e.date <= ?';
            params.push(end_date);
        }

        if (status && status !== 'All') {
            query += ' AND e.status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (e.description LIKE ? OR c.name LIKE ? OR e.amount LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY e.date DESC';

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Fetch Expenses Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
