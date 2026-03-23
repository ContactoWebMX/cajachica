const db = require('./config/db');
db.query("INSERT INTO advances (user_id, amount_requested, amount_approved, status, notes, project, request_date, type) VALUES (1, 2000, 2000, 'Aprobado', 'Test Modal', 'Debug Modal', NOW(), 'Reembolso')")
    .then(([res]) => {
        console.log('Created Reimbursement ID:', res.insertId);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
