const db = require('./config/db');

async function cleanProductionDB() {
    console.log('Starting production database cleanup...');
    try {
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        const tablesToClear = [
            'expenses',
            'advances',
            'cash_flows',
            'reconciliations',
            'system_logs',
            'push_subscriptions'
        ];

        for (const table of tablesToClear) {
            console.log(`Truncating table: ${table}...`);
            await db.query(`TRUNCATE TABLE ${table}`);
        }

        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Production database cleanup completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error during production cleanup:', err);
        try {
            await db.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (e) { }
        process.exit(1);
    }
}

cleanProductionDB();
