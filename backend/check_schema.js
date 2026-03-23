
const db = require('./config/db');
async function check() {
    try {
        const [rows] = await db.query('DESCRIBE advances');
        console.log('Advances Schema:', rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
