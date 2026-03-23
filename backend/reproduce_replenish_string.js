const axios = require('axios');

async function testReplenishString() {
    try {
        console.log('Testing Fund Replenishment with STRING amount...');
        const payload = {
            amount: "500.00", // String instead of number
            description: 'Test String Amount',
            user_id: 1
        };

        console.log('Sending payload:', payload);

        const res = await axios.post('http://localhost:3000/api/finance/replenish', payload);
        console.log('Status:', res.status);
        console.log('Response:', res.data);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testReplenishString();
