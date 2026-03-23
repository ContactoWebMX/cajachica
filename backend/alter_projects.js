const db = require('./config/db');

async function migrate() {
    try {
        await db.query('ALTER TABLE projects DROP COLUMN status');
        await db.query('ALTER TABLE projects ADD COLUMN active BOOLEAN DEFAULT TRUE');
        console.log('Successfully altered projects table');
        process.exit(0);
    } catch (e) {
        console.error('Error altering table:', e);
        process.exit(1);
    }
}

migrate();
