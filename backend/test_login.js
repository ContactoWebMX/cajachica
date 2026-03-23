const axios = require('axios');

async function testLogin() {
    try {
        const res = await axios.post('http://localhost:3000/api/users/login', {
            email: 'admin@induwell.com',
            password: 'password123'
        });
        console.log('Login Status:', res.status);
        console.log('User Data:', JSON.stringify(res.data, null, 2));

        if (!res.data.role) {
            console.error('CRITICAL: role field is missing!');
        } else {
            console.log('SUCCESS: role field is present:', res.data.role);
        }
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.data : error.message);
    }
}

testLogin();
