const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function testReimbursements() {
    try {
        // Use a known user ID, e.g., 21 (Usuario Prueba) or 1 (Admin)
        const USER_ID = 1;
        console.log(`Fetching balance for User ID: ${USER_ID}`);

        const res = await axios.get(`${API_URL}/advances/balance/${USER_ID}`);
        console.log('Balance Data:', res.data);

        if (res.data.total_reimbursements !== undefined) {
            console.log('SUCCESS: total_reimbursements field is present.');
        } else {
            console.log('FAILURE: total_reimbursements field is missing.');
        }

    } catch (error) {
        console.error('Error fetching balance:', error.response ? error.response.data : error.message);
    }
}

testReimbursements();
