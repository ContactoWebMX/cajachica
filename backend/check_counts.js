const db = require('./config/db');

async function checkCounts() {
    try {
        const [users] = await db.execute('SELECT COUNT(*) as count FROM users');
        const [categories] = await db.execute('SELECT COUNT(*) as count FROM expense_categories');
        const [costCenters] = await db.execute('SELECT COUNT(*) as count FROM cost_centers');
        const [advances] = await db.execute('SELECT COUNT(*) as count FROM advances');

        console.log('Users:', users[0].count);
        console.log('Categories:', categories[0].count);
        console.log('Cost Centers:', costCenters[0].count);
        console.log('Advances:', advances[0].count);

    } catch (error) {
        console.error('Error checking counts:', error);
    } finally {
        process.exit();
    }
}

checkCounts();
