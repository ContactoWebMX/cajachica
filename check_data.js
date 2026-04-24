const db = require('./backend/config/db');

async function checkData() {
    try {
        const [rows] = await db.query('SELECT * FROM cash_flows ORDER BY id DESC LIMIT 5');
        console.log('Recent cash_flows:', JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        process.exit();
    }
}

checkData();
