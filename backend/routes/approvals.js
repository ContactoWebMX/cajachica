const express = require('express');
const router = express.Router();
const db = require('../config/db');


// GET /api/approvals/pending - Get pending expenses for a manager
// In a real app, middleware would identify the logged-in manager (req.user.id)
// For now, we will pass manager_id as a query param or header for prototype
router.get('/pending', async (req, res) => {
    // const managerId = req.user.id; 
    const managerId = req.query.manager_id || 1; // Default to ID 1 for testing

    const status = req.query.status || 'Pendiente';

    try {
        // Fetch Settings for Directors
        const [settingsResult] = await db.query('SELECT setting_value FROM app_settings WHERE setting_key = "DIRECTOR_USER_IDS"');
        let directorIds = [];
        if (settingsResult.length > 0) {
            try {
                directorIds = JSON.parse(settingsResult[0].setting_value);
                if (!Array.isArray(directorIds)) directorIds = [];
            } catch (e) {
                // heuristic for comma separated
                directorIds = settingsResult[0].setting_value.split(',').map(Number);
            }
        }

        // Check if requester is Admin
        const [users] = await db.query(`
            SELECT r.name as role 
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        `, [managerId]);
        const role = users.length > 0 ? users[0].role : '';
        const isAdmin = role === 'Admin';
        const isCashier = role === 'Cajero';
        const isDirector = role === 'Director' || directorIds.includes(parseInt(managerId));

        let showAll = 0;
        let statusCondition = 'e.status = ?';
        let queryParams = [status];

        if (status === 'Aprobado Director') {
            if (isAdmin || isCashier) showAll = 1;
            else return res.json([]);
        } else if (status === 'AdminPending') {
            if (isAdmin) showAll = 1;
            else return res.json([]);
            statusCondition = "e.status IN ('Pendiente', 'Aprobado Jefe', 'Pendiente Dirección')";
            queryParams = [];
        } else if (status === 'Aprobado Jefe') {
            if (isAdmin || isDirector) {
                showAll = 1;
            } else {
                return res.json([]);
            }
        } else {
            showAll = isAdmin ? 1 : 0;
        }

        const [expenses] = await db.query(`
            SELECT e.*, u.name as employee_name, ec.name as category, cc.code as cost_center, p.name as project
            FROM expenses e
            JOIN users u ON e.user_id = u.id
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN cost_centers cc ON e.cost_center_id = cc.id
            LEFT JOIN projects p ON e.project_id = p.id
            WHERE ${statusCondition}
            AND(
                ${showAll} = 1 OR 
                u.reports_to = ?
            )
            ORDER BY e.date DESC
            `, [...queryParams, managerId]);

        res.json(expenses);
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/approvals/pending-advances
router.get('/pending-advances', async (req, res) => {
    const managerId = req.query.manager_id || 1;
    const status = req.query.status || 'Pendiente';

    try {
        // Check if requester is Admin
        const [users] = await db.query(`
            SELECT r.name as role 
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
            `, [managerId]);
        const role = users.length > 0 ? users[0].role : '';
        const isAdmin = role === 'Admin';
        const isCashier = role === 'Cajero';

        const [settingsResult] = await db.query('SELECT setting_value FROM app_settings WHERE setting_key = "DIRECTOR_USER_IDS"');
        let directorIds = [];
        if (settingsResult.length > 0) {
            try { directorIds = JSON.parse(settingsResult[0].setting_value); if (!Array.isArray(directorIds)) directorIds = []; } catch (e) { directorIds = settingsResult[0].setting_value.split(',').map(Number); }
        }
        const isDirector = role === 'Director' || directorIds.includes(parseInt(managerId));

        let showAll = 0;
        let statusCondition = 'a.status = ?';
        let queryParams = [status];

        if (status === 'Aprobado Director') {
            if (isAdmin || isCashier) showAll = 1;
            else return res.json([]);
        } else if (status === 'AdminPending') {
            if (isAdmin) showAll = 1;
            else return res.json([]);
            statusCondition = "a.status IN ('Pendiente', 'Aprobado Jefe', 'Pendiente Dirección')";
            queryParams = [];
        } else if (status === 'Aprobado Jefe') {
            if (isAdmin || isDirector) showAll = 1;
            else return res.json([]);
        } else {
            showAll = isAdmin ? 1 : 0;
        }

        const [advances] = await db.query(`
            SELECT a.*, u.name as employee_name, c.name as category_name, cc.name as cost_center_name, d.name as department_name, p.name as project
            FROM advances a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN expense_categories c ON a.category_id = c.id
            LEFT JOIN cost_centers cc ON a.cost_center_id = cc.id
            LEFT JOIN departments d ON a.department_id = d.id
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE(u.reports_to = ? OR ${showAll} = 1) AND ${statusCondition}
            ORDER BY a.request_date DESC
            `, [managerId, ...queryParams]);

        res.json(advances);
    } catch (error) {
        console.error('Error fetching pending advances:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/approvals/:id/action - Approve or Reject
router.post('/:id/action', async (req, res) => {
    const { id } = req.params;
    const { action, notes, manager_id, amount_approved } = req.body; // action: 'Aprobado' | 'Rechazado'

    if (!['Aprobado', 'Rechazado', 'Pagar'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
    }

    try {
        let newStatus = action;
        let finalAmount = 0;

        // 1. Get Expense Details
        const [expenseRows] = await db.query('SELECT amount, status, amount_approved FROM expenses WHERE id = ?', [id]);
        if (expenseRows.length === 0) return res.status(404).json({ error: 'Expense not found' });
        const { amount, status: currentStatus, amount_approved: currentAmountApproved } = expenseRows[0];

        // 2. State Machine Logic
        if (action === 'Rechazado') {
            finalAmount = 0;
            newStatus = 'Rechazado';
        } else if (action === 'Pagar') {
            // VERIFY PERMISSION: Must be Cajero or Admin
            const [approverUser] = await db.query(`SELECT r.name as role FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?`, [manager_id]);
            const role = approverUser.length > 0 ? approverUser[0].role : '';
            if (role !== 'Admin' && role !== 'Cajero') {
                return res.status(403).json({ error: 'Solo Administración o Caja pueden realizar pagos.' });
            }
            if (currentStatus !== 'Aprobado Director') {
                if (role === 'Admin' && currentStatus === 'Aprobado Jefe') {
                    // Admin might try to pay directly? Best to enforce the flow.
                }
                return res.status(400).json({ error: 'El gasto debe estar Aprobado Director para poder pagarse.' });
            }
            finalAmount = currentAmountApproved || amount;
            newStatus = 'Pagado';
        } else if (action === 'Aprobado') {
            finalAmount = (amount_approved !== undefined && amount_approved !== null) ? amount_approved : amount;

            // Get Settings
            const [settings] = await db.query('SELECT setting_value FROM app_settings WHERE setting_key = "DIRECTOR_USER_IDS"');
            let directorIds = [];
            if (settings.length > 0) {
                try { directorIds = JSON.parse(settings[0].setting_value); } catch (e) { directorIds = settings[0].setting_value.split(',').map(Number); }
                if (!Array.isArray(directorIds)) directorIds = [];
            }

            const [approverUser] = await db.query(`SELECT r.name as role FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?`, [manager_id]);
            const approverRole = approverUser.length > 0 ? approverUser[0].role : '';
            const isApproverAdmin = approverRole === 'Admin';
            const isApproverDirector = approverRole === 'Director' || directorIds.includes(parseInt(manager_id));

            if (currentStatus === 'Pendiente') {
                newStatus = 'Aprobado Jefe';
            } else if (currentStatus === 'Aprobado Jefe') {
                if (!isApproverAdmin && !isApproverDirector) {
                    return res.status(403).json({ error: 'No tienes permisos de Dirección para aprobar este gasto.' });
                }
                newStatus = 'Aprobado Director';
            } else {
                return res.status(400).json({ error: 'Estado actual no permite esta aprobación.' });
            }
        }

        // Fetch approver name if approving
        let approverName = null;
        if (manager_id && (newStatus === 'Aprobado Director' || newStatus === 'Aprobado Jefe')) {
            const [mgrData] = await db.query('SELECT name FROM users WHERE id = ?', [manager_id]);
            if (mgrData.length > 0) approverName = mgrData[0].name;
        }

        // Update expense status
        let queryStr = 'UPDATE expenses SET status = ?, approved_by = ?, amount_approved = ?, rejection_reason = ?';
        let queryParams = [newStatus, manager_id, finalAmount, req.body.rejection_reason || null];

        if (approverName) {
            queryStr += ', approver_name = ?';
            queryParams.push(approverName);
        }

        queryStr += ' WHERE id = ?';
        queryParams.push(id);

        await db.execute(queryStr, queryParams);

        // 4. Handle Linked 'Devolucion' (Cash Return)
        // If expense is approved/rejected, update the linked return advance
        if (newStatus === 'Aprobado Director' || newStatus === 'Rechazado' || newStatus === 'Pagado') {
            const returnStatus = newStatus === 'Aprobado Director' ? 'Aprobado Director' : (newStatus === 'Pagado' ? 'Pagado' : 'Rechazado');

            // Find advance with type 'Devolucion' and notes containing this expense ID
            // Note: using LIKE is a bit loose but works for the current note format: "Devolución de remanente (Gasto #ID)"
            // Ideally we'd store expense_id in advances table, but this avoids schema ambiguity for now.
            await db.execute(
                `UPDATE advances 
                 SET status = ?, action_date = NOW() 
                 WHERE type = 'Devolucion' AND notes LIKE ? AND user_id = (SELECT user_id FROM expenses WHERE id = ?)`,
                [returnStatus, `% Gasto #${id}) % `, id]
            );
        }

        // --- EMAIL NOTIFICATION (Status Update) ---
        try {
            const { sendStatusUpdateNotification } = require('../services/emailService');
            // Get Requester Email
            const [expenses] = await db.query(
                `SELECT e.user_id, u.email 
                 FROM expenses e 
                 JOIN users u ON e.user_id = u.id 
                 WHERE e.id = ? `,
                [id]
            );

            if (expenses.length > 0) {
                const recipientEmail = expenses[0].email;
                if (recipientEmail) {
                    // Get rejection reason or approval notes if any
                    const comments = action === 'Rechazado' ? req.body.rejection_reason : notes;
                    sendStatusUpdateNotification(
                        recipientEmail,
                        'Gasto',
                        newStatus,
                        comments || ''
                    ).catch(err => console.error('Background Email Error:', err));
                }
            }
        } catch (emailError) {
            console.error('Failed to initiate status email:', emailError);
        }
        // ------------------------------------------

        res.json({ message: `Expense updated to ${newStatus} ` });
    } catch (error) {
        console.error('Error processing approval:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
