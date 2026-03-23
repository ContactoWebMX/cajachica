
const db = require('./config/db');
async function check() {
    try {
        const [rows] = await db.query('DESCRIBE expenses');
        console.log('Expenses Schema:', rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
