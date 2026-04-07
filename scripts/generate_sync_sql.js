const db = require('../backend/config/db');
const fs = require('fs');

const dumpTables = [
    'roles',
    'departments',
    'cost_centers',
    'expense_categories',
    'projects',
    'companies',
    'app_settings',
    'users'
];

const tableDefinitions = {
    roles: `CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    departments: `CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        cost_center_id INT,
        active BOOLEAN DEFAULT TRUE
    );`,
    cost_centers: `CREATE TABLE IF NOT EXISTS cost_centers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    expense_categories: `CREATE TABLE IF NOT EXISTS expense_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    projects: `CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    companies: `CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        rfc VARCHAR(20),
        description TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    app_settings: `CREATE TABLE IF NOT EXISTS app_settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );`,
    users: `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        password VARCHAR(255),
        role VARCHAR(50),
        role_old VARCHAR(50),
        role_id INT,
        department_id INT,
        reports_to INT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );`
};

async function generateDump() {
    let sqlOutput = "-- FULL CPANEL SYNC SCRIPT --\n";
    sqlOutput += "-- Generado para corregir errores de tablas faltantes y sincronizar datos de prueba --\n\n";
    sqlOutput += "SET FOREIGN_KEY_CHECKS = 0;\n\n";

    for (const table of dumpTables) {
        try {
            sqlOutput += `-- TABLE: ${table} --\n`;
            if (tableDefinitions[table]) {
                sqlOutput += `${tableDefinitions[table]}\n`;
            }

            const [rows] = await db.query(`SELECT * FROM ${table}`);
            if (rows.length > 0) {
                sqlOutput += `TRUNCATE TABLE ${table};\n`;

                const columns = Object.keys(rows[0]);
                const columnNames = columns.join(', ');

                const values = rows.map(row => {
                    const rowValues = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                        return val;
                    });
                    return `(${rowValues.join(', ')})`;
                });

                sqlOutput += `INSERT INTO ${table} (${columnNames}) VALUES \n${values.join(',\n')};\n\n`;
            } else {
                sqlOutput += `-- No data found in ${table}, only structure generated.\n\n`;
            }
        } catch (e) {
            console.error(`Error dumping ${table}:`, e.message);
        }
    }

    sqlOutput += "SET FOREIGN_KEY_CHECKS = 1;\n";
    fs.writeFileSync('full_sync_cpanel.sql', sqlOutput);
    console.log('Script generado con éxito: full_sync_cpanel.sql');
    process.exit(0);
}

generateDump();
