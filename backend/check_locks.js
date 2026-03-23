
const db = require('./config/db');
async function check() {
    try {
        const [rows] = await db.query('SHOW PROCESSLIST');
        console.log('Processes:', rows);

        // Optional: Kill stuck queries?
        // for (const row of rows) {
        //    if (row.Command === 'Query' && row.Time > 10) { ... }
        // }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
