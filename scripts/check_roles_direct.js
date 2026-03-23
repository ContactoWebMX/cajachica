const mysql = require('mysql2/promise');

async function checkRoles() {
    const config = {
        host: '127.0.0.1', // Force TCP to use password
        user: 'root',
        password: 'password123',
        database: 'induwell_db'
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected!');

        const [roles] = await connection.execute('SELECT * FROM roles');
        console.log('Roles:', roles);

        const [users] = await connection.execute('SELECT id, name, email, role_id FROM users WHERE email="bsdiaz@induwell.com"');
        console.log('User bsdiaz:', users);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkRoles();
