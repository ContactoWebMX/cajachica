const baseURL = 'http://localhost:3000/api';

(async () => {
    try {
        console.log('Testing Catalogs...');
        const cats = await fetch(`${baseURL}/catalogs/categories`).then(r => r.json());
        const ccs = await fetch(`${baseURL}/catalogs/cost-centers`).then(r => r.json());

        if (cats.length === 0 || ccs.length === 0) {
            console.error('No cats/ccs found. Seeding required?');
            return;
        }

        const payload = {
            user_id: 1,
            amount: 50.00,
            description: 'Test Expense with Category',
            date: new Date().toISOString().split('T')[0],
            rfc: 'TEST' + Date.now(),
            folio: 'F' + Date.now(),
            category_id: cats[0].id,
            cost_center_id: ccs[0].id,
            advance_id: null // Explicitly null to avoid validation error if no advance exists
        };

        console.log('Sending payload:', payload);

        const res = await fetch(`${baseURL}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log('Response:', res.status, data);

    } catch (error) {
        console.error('Test Error:', error);
    }
})();
