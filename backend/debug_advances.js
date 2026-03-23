const db = require('./config/db');
async function checkAdvances() {
    try {
        const [rows] = await db.query('SELECT id, type, status, amount_requested FROM advances');
        console.log('--- Advances Table Content ---');
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkAdvances();
