const db = require('./config/db');

async function cleanDB() {
    console.log('Starting database cleanup...');
    try {
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        console.log('Truncating transaction tables...');
        await db.query('TRUNCATE TABLE expenses');
        await db.query('TRUNCATE TABLE advances');
        await db.query('TRUNCATE TABLE cash_flows');
        await db.query('TRUNCATE TABLE reconciliations');
        await db.query('TRUNCATE TABLE system_logs');
        await db.query('TRUNCATE TABLE push_subscriptions');

        console.log('Truncating catalog tables...');
        await db.query('TRUNCATE TABLE companies');
        await db.query('TRUNCATE TABLE cost_centers');
        await db.query('TRUNCATE TABLE departments');
        await db.query('TRUNCATE TABLE expense_categories');
        await db.query('TRUNCATE TABLE projects');
        await db.query('TRUNCATE TABLE custom_fields');

        console.log('Cleaning users table (keeping admin)...');
        await db.query('DELETE FROM users WHERE email != "hgonzalez@induwell.com"');

        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Cleanup completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error during cleanup:', err);
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        process.exit(1);
    }
}

cleanDB();
