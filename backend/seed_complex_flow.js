const db = require('./config/db');

// Config
const NUM_ADVANCES = 50;
const NUM_EXPENSES = 50;
const PROJECTS = ['Obra Norte', 'Mantenimiento Q1', 'Oficinas Centrales', null];
const USERS_ROLES = [
    { id: 1, role: 'Admin' },
    { id: 2, role: 'Employee' } // Assuming user 2 exists
];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomAmount = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

async function seed() {
    try {
        console.log('--- Seeding Complex Flow Data ---');

        // 1. Clear Data
        await db.execute('SET FOREIGN_KEY_CHECKS = 0');
        await db.execute('TRUNCATE TABLE advances');
        await db.execute('TRUNCATE TABLE expenses');
        await db.execute('TRUNCATE TABLE cash_flows');
        await db.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Tables truncated.');

        // 2. Replenish Cash (Ingreso)
        await db.execute(
            'INSERT INTO cash_flows (type, amount, description, user_id, date) VALUES (?, ?, ?, ?, NOW())',
            ['ingreso', 50000.00, 'Capital Inicial Test', 1]
        );
        console.log('Cash Replenished: $50,000');

        // 3. Seed Advances
        console.log(`Seeding ${NUM_ADVANCES} Advances...`);
        const advancePromises = [];
        for (let i = 0; i < NUM_ADVANCES; i++) {
            const amount = getRandomAmount(500, 2500); // 500 to 2500. Cutoff is 1000.
            const project = getRandomElement(PROJECTS);

            advancePromises.push(db.execute(
                'INSERT INTO advances (user_id, amount_requested, status, notes, project, request_date) VALUES (?, ?, ?, ?, ?, NOW())',
                [2, amount, 'Pendiente', `Advance Test ${i}`, project]
            ));
        }
        await Promise.all(advancePromises);

        // 4. Seed Expenses
        console.log(`Seeding ${NUM_EXPENSES} Expenses...`);
        const expensePromises = [];
        for (let i = 0; i < NUM_EXPENSES; i++) {
            const amount = getRandomAmount(100, 1500); // 100 to 1500. Cutoff is 1000.
            const project = getRandomElement(PROJECTS);

            expensePromises.push(db.execute(
                'INSERT INTO expenses (user_id, amount, description, status, project, date) VALUES (?, ?, ?, ?, ?, NOW())',
                [2, amount, `Expense Test ${i}`, 'Pendiente', project]
            ));
        }
        await Promise.all(expensePromises);

        console.log('--- Seeding Complete ---');
        console.log(`Created ${NUM_ADVANCES} Advances and ${NUM_EXPENSES} Expenses.`);
        process.exit(0);

    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
}

seed();
