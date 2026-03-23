
const db = require('./config/db');
async function check() {
    try {
        const [rows] = await db.query('SELECT * FROM roles');
        console.log('Roles:', rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
