const axios = require('axios');
const db = require('./config/db'); // Ensure correct path

// Config
const API_URL = 'http://localhost:3000/api';
const MIN_AMOUNT = 1000;

async function verify() {
    try {
        console.log('--- Verifying Conditional Logic ---');

        // 1. Get IDs of test items
        const [advances] = await db.query('SELECT * FROM advances WHERE status = "Pendiente"');
        const [expenses] = await db.query('SELECT * FROM expenses WHERE status = "Pendiente"');

        const lowAdvance = advances.find(a => a.amount_requested < MIN_AMOUNT);
        const highAdvance = advances.find(a => a.amount_requested > MIN_AMOUNT);
        const lowExpense = expenses.find(e => e.amount < MIN_AMOUNT);
        const highExpense = expenses.find(e => e.amount > MIN_AMOUNT);

        if (!lowAdvance || !highAdvance || !lowExpense || !highExpense) {
            console.error('CRITICAL: Not enough varied data to test conditionals.');
            process.exit(1);
        }

        console.log(`Testing Low Advance (${lowAdvance.amount_requested})...`);
        await axios.put(`${API_URL}/advances/${lowAdvance.id}/approve`, {
            status: 'Aprobado',
            amount_approved: lowAdvance.amount_requested,
            notes: 'Low Auto Approve'
        });
        const [checkLowAdv] = await db.query('SELECT status FROM advances WHERE id = ?', [lowAdvance.id]);
        console.log(`Result: ${checkLowAdv[0].status} (Expected: Aprobado)`);

        console.log(`Testing High Advance (${highAdvance.amount_requested})...`);
        await axios.put(`${API_URL}/advances/${highAdvance.id}/approve`, {
            status: 'Aprobado',
            amount_approved: highAdvance.amount_requested,
            notes: 'High Manual Approve'
        });
        const [checkHighAdv] = await db.query('SELECT status FROM advances WHERE id = ?', [highAdvance.id]);
        console.log(`Result: ${checkHighAdv[0].status} (Expected: Pendiente Dirección)`);

        console.log(`Testing Low Expense (${lowExpense.amount})...`);
        await axios.post(`${API_URL}/approvals/${lowExpense.id}/action`, {
            action: 'Aprobado',
            manager_id: 1
        });
        const [checkLowExp] = await db.query('SELECT status FROM expenses WHERE id = ?', [lowExpense.id]);
        console.log(`Result: ${checkLowExp[0].status} (Expected: Aprobado)`);

        console.log(`Testing High Expense (${highExpense.amount})...`);
        await axios.post(`${API_URL}/approvals/${highExpense.id}/action`, {
            action: 'Aprobado',
            manager_id: 1
        });
        const [checkHighExp] = await db.query('SELECT status FROM expenses WHERE id = ?', [highExpense.id]);
        console.log(`Result: ${checkHighExp[0].status} (Expected: Pendiente Dirección)`);

        console.log('--- Verification Complete ---');
        process.exit(0);

    } catch (error) {
        console.error('Verification Error:', error.message);
        if (error.response) console.error(error.response.data);
        process.exit(1);
    }
}

verify();
