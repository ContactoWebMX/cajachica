const fs = require('fs');
const path = require('path');
const db = require('./config/db');

const migrations = [
    '000_initial_schema.sql',
    '001_add_advances_and_ocr.sql',
    '002_admin_features.sql',
    '003_financial_control.sql',
    '004_professional_modules.sql'
];

const run = async () => {
    try {
        console.log('Connecting to database...');
        // Test connection
        await db.query('SELECT 1');
        console.log('Connected.');

        for (const file of migrations) {
            console.log(`\n--- Running ${file} ---`);
            const filePath = path.join(__dirname, 'migrations', file);
            const sql = fs.readFileSync(filePath, 'utf8');

            // Split by ';' but be careful with stored procedures if any.
            // For simple schema updates, this is usually fine.
            // However, db.query might support multiple statements if enabled in config.
            // Let's assume we need to execute them one by one or as a block if the driver supports it.
            // mysql2 supports multipleStatements if configured.
            // Let's try executing the whole block. If it fails, we split.

            // Enable multiple statements for this connection if not already
            // db.query usually uses a pool. We can try executing the content.

            // To be safer, let's split by statement for better error reporting, 
            // although naive splitting on ';' can break strings.
            // Given the complexity, let's try reading and executing the file content as is.
            // Note: DB config must have multipleStatements: true for this to work with multiple queries in one call.
            // If not, we might need a more robust parser or just split by valid semicolons.

            // Let's try splitting by default for safety against "multipleStatements: false" default.
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const statement of statements) {
                try {
                    await db.query(statement);
                } catch (err) {
                    if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
                        console.log(`Skipping duplicate/existing: ${err.sqlMessage}`);
                    } else {
                        throw err;
                    }
                }
            }
            console.log(`Verified ${file}`);
        }

        console.log('\nAll migrations executed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

run();
