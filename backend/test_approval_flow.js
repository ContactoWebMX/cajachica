
const axios = require('axios'); // if installed, or use fetch
const db = require('./config/db');

async function test() {
    try {
        // 1. Get a pending expense
        const [rows] = await db.query("SELECT id FROM expenses WHERE status='Pendiente' LIMIT 1");
        if (rows.length === 0) {
            console.log('No pending expenses found to test.');
            process.exit(0);
        }
        const expenseId = rows[0].id;
        console.log(`Testing approval for Expense ID: ${expenseId}`);

        // 2. Call API (mocking the request - assuming no auth middleware strictness for internal IP or valid token simulation)
        // Wait, routes/approvals.js doesn't check auth middleware in the snippet I saw! 
        // It just takes params.

        // Let's try calling it.
        const response = await fetch(`http://localhost:3000/api/approvals/${expenseId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'Aprobado',
                manager_id: 1, // Admin
                notes: 'Approved via test script'
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        // 3. Verify DB
        const [check] = await db.query("SELECT status, approved_by FROM expenses WHERE id=?", [expenseId]);
        console.log('DB State:', check[0]);

        if (check[0].status === 'Aprobado') {
            console.log('SUCCESS: Expense approved!');
        } else {
            console.error('FAILURE: Status did not update.');
            process.exit(1);
        }

        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
}
test();
