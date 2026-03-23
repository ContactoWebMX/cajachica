const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function checkBalance() {
    try {
        // 1. Login (or assume user 1 if no auth)
        // Adjust based on actual user. Subagent usually uses Admin (id 1?).
        const userId = 1;

        console.log(`Checking balance for user ${userId}...`);
        const res = await axios.get(`${API_URL}/advances/balance/${userId}`);
        console.log('Balance Data:', res.data);

        // Also fetch raw lists to manually verify
        const advRes = await axios.get(`${API_URL}/advances?user_id=${userId}&status=Aprobado`);
        const expRes = await axios.get(`${API_URL}/expenses?user_id=${userId}&status=Aprobado`);

        const totalAdv = advRes.data.reduce((sum, a) => sum + parseFloat(a.amount_approved || 0), 0);
        const totalExp = expRes.data.reduce((sum, e) => sum + parseFloat(e.amount), 0);

        console.log('Manual Calc:');
        console.log('Total Approved Advances:', totalAdv);
        console.log('Total Approved Expenses:', totalExp);
        console.log('Diff:', totalAdv - totalExp);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkBalance();
