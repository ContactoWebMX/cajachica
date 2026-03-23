const db = require('../config/db');

async function runMigration() {
    try {
        console.log('Modifying advances status enum...');
        // Add 'Pagado' to the ENUM
        await db.query(`
            ALTER TABLE advances 
            MODIFY COLUMN status ENUM('Pendiente', 'Aprobado', 'Rechazado', 'Comprobado', 'Pendiente Dirección', 'Pagado') DEFAULT 'Pendiente'
        `);
        console.log('Migration successful: Added "Pagado" to status enum.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
