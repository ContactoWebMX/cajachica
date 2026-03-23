const db = require('../config/db');

async function migrate() {
    try {
        console.log('Adding type column to advances table...');
        await db.execute("ALTER TABLE advances ADD COLUMN type ENUM('Adelanto', 'Reembolso') DEFAULT 'Adelanto' AFTER user_id");
        console.log('Migration successful.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
        } else {
            console.error('Migration failed:', error);
        }
        process.exit(1);
    }
}

migrate();
