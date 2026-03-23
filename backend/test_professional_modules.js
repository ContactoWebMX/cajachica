const baseURL = 'http://localhost:3000/api';

(async () => {
    try {
        console.log('Testing Catalogs...');
        const cats = await fetch(`${baseURL}/catalogs/categories`).then(r => r.json());
        console.log(`Categories: ${cats.length} found`);

        const ccs = await fetch(`${baseURL}/catalogs/cost-centers`).then(r => r.json());
        console.log(`Cost Centers: ${ccs.length} found`);

        const depts = await fetch(`${baseURL}/catalogs/departments`).then(r => r.json());
        console.log(`Departments: ${depts.length} found`);

        console.log('Testing Users...');
        const users = await fetch(`${baseURL}/users`).then(r => r.json());
        console.log(`Users: ${users.length} found`);

        console.log('All backend tests passed!');
    } catch (error) {
        console.error('Backend Verification Failed:', error);
    }
})();
