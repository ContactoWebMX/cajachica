const axios = require('axios');

async function testEdgeCases() {
    try {
        console.log('--- Test 1: Amount = 0 ---');
        try {
            await axios.post('http://localhost:3000/api/finance/replenish', {
                amount: 0,
                description: 'Zero Amount',
                user_id: 1
            });
            console.log('Zero Amount: SUCCESS (Unexpected if validation exists)');
        } catch (e) {
            console.log('Zero Amount: FAILED as expected?', e.response ? e.response.data : e.message);
        }

        console.log('\n--- Test 2: Missing User ID ---');
        try {
            await axios.post('http://localhost:3000/api/finance/replenish', {
                amount: 100,
                description: 'Missing User'
            });
            console.log('Missing User: SUCCESS (Unexpected)');
        } catch (e) {
            console.log('Missing User: FAILED as expected?', e.response ? e.response.data : e.message);
        }

        console.log('\n--- Test 3: Invalid User ID (Non-existent) ---');
        try {
            await axios.post('http://localhost:3000/api/finance/replenish', {
                amount: 100,
                description: 'Invalid User',
                user_id: 99999
            });
            console.log('Invalid User: SUCCESS (Unexpected)');
        } catch (e) {
            console.log('Invalid User: FAILED as expected?', e.response ? e.response.data : e.message);
        }

    } catch (error) {
        console.error('General Error:', error);
    }
}

testEdgeCases();
