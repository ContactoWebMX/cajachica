
const db = require('./config/db');
const bcrypt = require('bcryptjs');

const NUM_USERS = 15;
const NUM_ADVANCES = 50;
const NUM_EXPENSES = 50;

const ROLES = ['Admin', 'Manager', 'Employee'];
const DEPARTMENTS = ['Ventas', 'Operaciones', 'Recursos Humanos', 'Finanzas'];
const CATS = ['Viáticos', 'Transporte', 'Papelería', 'Comida', 'Hospedaje'];

async function seed() {
    console.log('🌱 Starting Massive Seeding...');

    try {
        // 1. Create Users
        console.log(`Creating ${NUM_USERS} users...`);
        const userIds = [];
        // Ensure we have at least one of each role
        const roleDistribution = ['Admin', 'Admin', 'Admin', 'Manager', 'Manager', 'Manager', 'Manager'];
        while (roleDistribution.length < NUM_USERS) roleDistribution.push('Empleado');

        // Fetch Role IDs first
        const [roles] = await db.query('SELECT id, name FROM roles');
        const roleMap = roles.reduce((acc, r) => ({ ...acc, [r.name]: r.id }), {});

        const passwordHash = await bcrypt.hash('password123', 10);

        for (let i = 0; i < NUM_USERS; i++) {
            const roleName = roleDistribution[i];
            const roleId = roleMap[roleName];
            const email = `user${i + 1}@induwell.test`;
            const name = `Usuario ${roleName} ${i + 1}`;

            // Check if user exists
            const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            let uid;

            if (exists.length > 0) {
                uid = exists[0].id;
            } else {
                const [res] = await db.execute(
                    'INSERT INTO users (name, email, password_hash, role_id, department_id, active) VALUES (?, ?, ?, ?, ?, ?)',
                    [name, email, passwordHash, roleId, 1, true] // Default Dept 1
                );
                uid = res.insertId;
            }
            userIds.push({ id: uid, role: roleName });
        }
        console.log('✅ Users created.');

        // 2. Create Advances
        console.log(`Creating ${NUM_ADVANCES} advances...`);
        const advanceIds = [];
        for (let i = 0; i < NUM_ADVANCES; i++) {
            const user = userIds[Math.floor(Math.random() * userIds.length)];
            const amount = (Math.random() * 5000 + 500).toFixed(2);
            const status = Math.random() > 0.7 ? 'Aprobado' : (Math.random() > 0.4 ? 'Pendiente' : 'Rechazado');

            const [res] = await db.execute(
                'INSERT INTO advances (user_id, amount_requested, amount_approved, status, notes, request_date) VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))',
                [
                    user.id,
                    amount,
                    status === 'Aprobado' ? amount : (status === 'Rechazado' ? 0 : null),
                    status,
                    `Anticipo masivo prueba #${i + 1}`,
                    Math.floor(Math.random() * 30) // Random date in last 30 days
                ]
            );
            if (status === 'Aprobado') advanceIds.push(res.insertId);
        }
        console.log('✅ Advances created.');

        // 3. Create Expenses
        console.log(`Creating ${NUM_EXPENSES} expenses...`);

        // Fetch Categories and Cost Centers
        const [categories] = await db.query('SELECT id FROM expense_categories');
        const [costCenters] = await db.query('SELECT id FROM cost_centers');

        for (let i = 0; i < NUM_EXPENSES; i++) {
            const user = userIds[Math.floor(Math.random() * userIds.length)];
            const advanceId = Math.random() > 0.5 && advanceIds.length > 0
                ? advanceIds[Math.floor(Math.random() * advanceIds.length)]
                : null;

            const amount = (Math.random() * 1000 + 50).toFixed(2);
            const catId = categories[Math.floor(Math.random() * categories.length)]?.id;
            const ccId = costCenters[Math.floor(Math.random() * costCenters.length)]?.id;
            const status = Math.random() > 0.3 ? 'Aprobado' : (Math.random() > 0.1 ? 'Pendiente' : 'Rechazado');

            await db.execute(
                `INSERT INTO expenses 
                (user_id, amount, description, date, status, category_id, cost_center_id, advance_id, rfc, folio) 
                VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), ?, ?, ?, ?, ?, ?)`,
                [
                    user.id,
                    amount,
                    `Gasto prueba masiva #${i + 1}`,
                    Math.floor(Math.random() * 30),
                    status,
                    catId || null,
                    ccId || null,
                    advanceId,
                    `RFC${Math.floor(Math.random() * 10000)}`,
                    `FOL-${i + 1}`
                ]
            );
        }
        console.log('✅ Expenses created.');

        console.log('🎉 Massive Seeding Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
