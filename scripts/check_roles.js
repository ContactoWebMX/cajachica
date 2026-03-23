const db = require('../backend/config/db');

async function checkRoles() {
    try {
        const [roles] = await db.query('SELECT * FROM roles');
        console.log('Roles:', roles);

        const [users] = await db.query('SELECT id, name, email, role_id FROM users WHERE email="bsdiaz@induwell.com"');
        console.log('User:', users);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkRoles();
