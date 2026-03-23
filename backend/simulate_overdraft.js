const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function simulate() {
    try {
        // 1. Get Users (Assuming admin/password123 works for auth)
        const loginRes = await axios.post(`${API_URL}/users/login`, {
            email: 'admin@induwell.com', // Trying likely admin email based on user prompt
            password: 'password123'
        });
        console.log('Login data:', loginRes.data);
        const token = loginRes.data.token || 'dummy_token';
        const config = { headers: { Authorization: `Bearer ${token}` } };

        console.log('Logged in.');

        // 2. Create Advance for User (Self or hgonzalez?)
        // Let's create for hgonzalez if possible, or simulate with current user.
        // User asked specifically about hgonzalez. Let's try to login as hgonzalez first.

        let htoken = token;
        let userId = loginRes.data.id;

        try {
            const hlogin = await axios.post(`${API_URL}/users/login`, { email: 'hgonzalez@induwell.com', password: 'password123' });
            htoken = hlogin.data.token || 'dummy_token';
            userId = hlogin.data.id;
            console.log('Logged in as hgonzalez.');
        } catch (e) {
            console.log('hgonzalez login failed, using admin.');
        }

        const hconfig = { headers: { Authorization: `Bearer ${htoken}` } };

        // 3. Create Advance (500)
        console.log('Requesting Advance 500...');
        const advRes = await axios.post(`${API_URL}/advances/request`, {
            user_id: userId,
            amount: 500,
            notes: 'Test Advance'
        }, hconfig);
        const advId = advRes.data.id;

        // Approve it (as admin)
        console.log('Approving Advance...');
        await axios.put(`${API_URL}/advances/${advId}/approve`, {
            status: 'Aprobado',
            amount_approved: 500
        }, config);

        // 4. Create Expense (600) linked to Advance
        console.log('Creating Expense 600...');
        await axios.post(`${API_URL}/expenses`, {
            user_id: userId,
            amount: 600,
            description: 'Over limit expense',
            advance_id: advId,
            date: new Date().toISOString().split('T')[0],
            category_id: 1, // assumption
            cost_center_id: 1 // assumption
        }, hconfig);

        // Approve expense (assuming logic allows approval even if > advance)
        // Need ID.
        // Get list to find ID.
        const expenses = await axios.get(`${API_URL}/expenses?user_id=${userId}`, hconfig);
        const expId = expenses.data[0].id; // Most recent?

        console.log('Approving Expense...');
        await axios.post(`${API_URL}/approvals/${expId}/action`, {
            action: 'Aprobado',
            manager_id: 1
        }, config);

        // 5. Check Balance
        const balRes = await axios.get(`${API_URL}/advances/balance/${userId}`, hconfig);
        console.log('Final Balance:', balRes.data);

    } catch (e) {
        console.error('Error:', e.response ? e.response.data : e.message);
    }
}

simulate();
