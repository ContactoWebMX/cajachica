const db = require('./backend/config/db');

async function checkSchema() {
    try {
        const [columns] = await db.query('SHOW COLUMNS FROM cash_flows');
        console.log('Columns in cash_flows:', columns.map(c => c.Field));
    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        process.exit();
    }
}

checkSchema();
