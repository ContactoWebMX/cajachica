const db = require('./backend/config/db');
async function test() {
    try {
        const id = 16;
        const cashier_id = 1;
        const [expenses] = await db.execute('SELECT * FROM expenses WHERE id = ?', [id]);
        const expense = expenses[0];
        console.log("Found expense", expense.id);
        
        await db.execute('UPDATE expenses SET status = "Pagado" WHERE id = ?', [id]);
        console.log("Updated expense");

        const cashDescription = `Reembolso de ticket #${expense.folio || expense.id}: ${expense.description}`;
        await db.execute(
            'INSERT INTO cash_flows (type, amount, description, user_id, date) VALUES (?, ?, ?, ?, NOW())',
            ['reembolso', expense.amount, cashDescription, cashier_id || expense.user_id]
        );
        console.log("Inserted cash flow");
        
        await db.execute(
            `INSERT INTO advances (user_id, amount_requested, amount_approved, status, type, notes, request_date) 
             VALUES (?, ?, ?, 'Pagado', 'Reembolso', ?, NOW())`,
            [expense.user_id, expense.amount, expense.amount, `Reembolso 1:1 de Gasto #${expense.id}`]
        );
        console.log("Inserted advance");

        await db.execute(
            'INSERT INTO system_logs (user_id, action, entity, entity_id, new_value) VALUES (?, ?, ?, ?, ?)',
            [cashier_id || expense.user_id, 'REIMBURSE', 'Expense', id, `Paid $${expense.amount}`]
        );
        console.log("Inserted log");
        
        console.log("Success");
    } catch(err) {
        console.error("FAIL:", err);
    } finally { process.exit(0); }
}
test();
