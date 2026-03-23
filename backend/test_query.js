const db = require('./config/db');

(async () => {
    try {
        const rfc = "GOHH820306";
        const folio = "1234";
        console.log('Running query...');
        const [existing] = await db.execute(
            'SELECT id FROM expenses WHERE rfc = ? AND folio = ?',
            [rfc, folio]
        );
        console.log('Result:', existing);
        process.exit(0);
    } catch (err) {
        console.error('Query Failed!');
        console.error('Code:', err.code);
        console.error('Message:', err.message);
        console.error('SQLState:', err.sqlState);
        process.exit(1);
    }
})();
