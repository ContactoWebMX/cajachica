const axios = require('axios');

async function testReplenish() {
    try {
        console.log('Testing Fund Replenishment...');
        const payload = {
            amount: 500.00,
            description: 'Test Replenish for Debugging',
            user_id: 1 // Assuming user 1 exists
        };

        console.log('Sending payload:', payload);

        const res = await axios.post('http://localhost:3000/api/finance/replenish', payload);
        console.log('Status:', res.status);
        console.log('Response:', res.data);

        // Fetch history to verify
        const historyRes = await axios.get('http://localhost:3000/api/finance/replenishments');
        const latest = historyRes.data[0];
        console.log('Latest replenishment:', latest);

        if (latest && latest.description === payload.description && parseFloat(latest.amount) === payload.amount) {
            console.log('SUCCESS: Replenishment verified.');
        } else {
            console.log('FAILURE: Replenishment not found in history.');
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testReplenish();
