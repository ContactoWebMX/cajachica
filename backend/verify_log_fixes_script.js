const axios = require('axios');
const FormData = require('form-data'); // Need to install if not present, or use JSON if route supports it.
// Route uses multer, so it expects multipart/form-data.

const API_URL = 'http://localhost:3000/api';

async function testExpenseEmptyAmount() {
    console.log('Testing Expense creation with empty string amount...');
    try {
        const form = new FormData();
        form.append('user_id', '1');
        form.append('amount', ''); // The culprit
        form.append('description', 'Test Empty Amount Fix');
        form.append('date', new Date().toISOString());

        const response = await axios.post(`${API_URL}/expenses`, form, {
            headers: form.getHeaders()
        });
        console.log('Expense Created Success:', response.data);
    } catch (error) {
        console.error('Expense Creation Failed:', error.response ? error.response.data : error.message);
    }
}

async function testAdvanceStatusUpdate() {
    console.log('\nTesting Advance Status Update to "Pendiente Dirección"...');
    try {
        // Assuming PUT /api/advances/:id/approve logic handles status updates or we can just update status directly if route allows
        // Checking routes/advances.js: PUT /:id/approve takes { status, amount_approved, notes }
        // The error was in 'UPDATE advances SET status = ? ...' inside this route.
        // It failed when setting status to something invalid for the ENUM.

        // Let's try to set it to 'Aprobado' with amount > 1000 which triggers 'Pendiente Dirección' internally?
        // OR if the user was manually setting it?
        // The error log showed: "Data truncated for column 'status'... UPDATE ... SET status = ?"
        // The logic in advances.js: 
        // if (currentStatus === 'Pendiente Dirección') { newStatus = 'Aprobado' }
        // else if (amountToCheck > minAmount) { newStatus = 'Pendiente Dirección' }

        // So we need to trigger the logic that sets it to 'Pendiente Dirección'.
        // That means approving an amount > 1000 (default limit).

        const response = await axios.put(`${API_URL}/advances/51/approve`, {
            status: 'Aprobado',
            amount_approved: 5000, // Should trigger escalation to 'Pendiente Dirección'
            notes: 'Test Escalation Fix'
        });
        console.log('Advance Update Success:', response.data);
    } catch (error) {
        console.error('Advance Update Failed:', error.response ? error.response.data : error.message);
    }
}

async function run() {
    await testExpenseEmptyAmount();
    await testAdvanceStatusUpdate();
}

run();
