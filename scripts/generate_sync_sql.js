const db = require('../backend/config/db');
const fs = require('fs');

async function generateFullDump() {
    let sqlOutput = "-- FULL CPANEL SYNC SCRIPT (DYNAMIC) --\n";
    sqlOutput += "-- Generado para sincronizar TODA la información actual de la base de datos local --\n\n";
    sqlOutput += "SET FOREIGN_KEY_CHECKS = 0;\n\n";

    try {
        // Get all tables
        const [tables] = await db.query("SHOW TABLES");
        const dbName = 'Tables_in_induwell_cloud_cash'; // Note: might vary depending on DB name, but usually it's this pattern
        const tableList = tables.map(t => Object.values(t)[0]);

        for (const table of tableList) {
            console.log(`Dumping table: ${table}...`);
            sqlOutput += `-- TABLE: ${table} --\n`;

            // Get Create Table info
            const [createTable] = await db.query(`SHOW CREATE TABLE ${table}`);
            sqlOutput += `DROP TABLE IF EXISTS ${table};\n`;
            sqlOutput += `${createTable[0]['Create Table']};\n`;

            // Get data
            const [rows] = await db.query(`SELECT * FROM ${table}`);
            if (rows.length > 0) {
                sqlOutput += `TRUNCATE TABLE ${table};\n`;

                const columns = Object.keys(rows[0]);
                const columnNames = columns.join(', ');

                // Chunk processed to avoid string length limits if tables are huge
                const valueChunks = [];
                for (const row of rows) {
                    const rowValues = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (val instanceof Buffer) return `0x${val.toString('hex')}`;
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (val instanceof Date) {
                            try {
                                return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                            } catch (e) {
                                return 'NULL';
                            }
                        }
                        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                        return val;
                    });
                    valueChunks.push(`(${rowValues.join(', ')})`);
                }

                sqlOutput += `INSERT INTO ${table} (${columnNames}) VALUES \n${valueChunks.join(',\n')};\n\n`;
            } else {
                sqlOutput += `-- No data found in ${table}.\n\n`;
            }
        }

        sqlOutput += "SET FOREIGN_KEY_CHECKS = 1;\n";
        fs.writeFileSync('full_sync_cpanel.sql', sqlOutput);
        console.log('Script generado con éxito: full_sync_cpanel.sql (con todas las tablas)');
    } catch (error) {
        console.error('Fatal Error during dump generation:', error);
    } finally {
        process.exit(0);
    }
}

generateFullDump();
