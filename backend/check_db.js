
const db = require('./config/db');
async function test() {
    try {
        const [rows] = await db.query('SELECT 1 as val');
        console.log('DB Connection OK:', rows[0].val);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
