const db = require('./config/db');
const http = require('http');

const TOTAL_ITEMS = 100; // 100 Advances + 100 Expenses = 200 total

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

(async () => {
    try {
        console.log('--- STARTING STRESS TEST ---');

        // 1. Get Users
        const [users] = await db.query("SELECT id FROM users WHERE role IN ('Employee', 'Manager', 'Admin')");
        if (users.length === 0) throw new Error('No users found. Run seed_massive.js first.');
        const userIds = users.map(u => u.id);
        console.log(`Found ${userIds.length} users for simulation.`);

        // 2. Insert Pending Data
        console.log(`\n--- INSERTING ${TOTAL_ITEMS} ADVANCES & ${TOTAL_ITEMS} EXPENSES ---`);
        const advanceIds = [];
        const expenseIds = [];

        for (let i = 0; i < TOTAL_ITEMS; i++) {
            const userId = userIds[Math.floor(Math.random() * userIds.length)];

            // Insert Advance
            const [advRes] = await db.execute(
                'INSERT INTO advances (user_id, amount_requested, status, notes, request_date) VALUES (?, ?, ?, ?, NOW())',
                [userId, 100 + i, 'Pendiente', `Stress Test Advance ${i}`]
            );
            advanceIds.push(advRes.insertId);

            // Insert Expense
            const [expRes] = await db.execute(
                'INSERT INTO expenses (user_id, amount, description, status, date) VALUES (?, ?, ?, ?, NOW())',
                [userId, 50 + i, `Stress Test Expense ${i}`, 'Pendiente']
            );
            expenseIds.push(expRes.insertId);
        }
        console.log('Insertion Complete.');

        // 3. Approve Advances via API
        console.log('\n--- APPROVING ADVANCES VIA API ---');
        let advSuccess = 0;
        let advStart = Date.now();

        // Run in batches or serial? Serial is safer but parallel stresses more.
        // User asked for "100 tests", usually implies sequential or grouped.
        // Let's do chunks of 10 to simulate some concurrency but not kill it instantly if pool is small (though we set it to 50).

        const chunk = 10;
        for (let i = 0; i < advanceIds.length; i += chunk) {
            const batch = advanceIds.slice(i, i + chunk).map(id => {
                return request({
                    hostname: 'localhost', port: 3000, path: `/api/advances/${id}/approve`, method: 'PUT',
                    headers: { 'Content-Type': 'application/json' }
                }, { status: 'Aprobado', amount_approved: 100 + i, notes: 'Stress Approved' })
                    .then(res => res.status === 200 ? 1 : 0)
                    .catch(err => { console.error(err.message); return 0; });
            });
            const results = await Promise.all(batch);
            advSuccess += results.reduce((a, b) => a + b, 0);
            process.stdout.write(`.`);
        }
        console.log(`\nAdvances: ${advSuccess}/${TOTAL_ITEMS} success. Time: ${(Date.now() - advStart)}ms`);

        // 4. Approve Expenses via API
        console.log('\n--- APPROVING EXPENSES VIA API ---');
        let expSuccess = 0;
        let expStart = Date.now();

        for (let i = 0; i < expenseIds.length; i += chunk) {
            const batch = expenseIds.slice(i, i + chunk).map(id => {
                return request({
                    hostname: 'localhost', port: 3000, path: `/api/approvals/${id}/action`, method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }, { action: 'Aprobado', manager_id: 1 })
                    .then(res => res.status === 200 ? 1 : 0)
                    .catch(err => { console.error(err.message); return 0; });
            });
            const results = await Promise.all(batch);
            expSuccess += results.reduce((a, b) => a + b, 0);
            process.stdout.write(`.`);
        }
        console.log(`\nExpenses: ${expSuccess}/${TOTAL_ITEMS} success. Time: ${(Date.now() - expStart)}ms`);

        console.log('\n--- TEST SUMMARY ---');
        if (advSuccess === TOTAL_ITEMS && expSuccess === TOTAL_ITEMS) {
            console.log('✅ SUCCESS: All 200 items processed correctly.');
        } else {
            console.log('❌ FAILURE: Some items failed.');
        }

        process.exit(0);

    } catch (error) {
        console.error('\nCRITICAL ERROR:', error);
        process.exit(1);
    }
})();
