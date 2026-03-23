// Node 18+ supports fetch natively
const baseURL = 'http://localhost:3000/api';

(async () => {
    try {
        const payload = {
            user_id: 1,
            amount: 1000,
            description: "TEST GASTO SCRIPT",
            date: "2026-02-16",
            rfc: "GOHH820306",
            folio: "1234",
            geo_lat: 19.4326,
            geo_long: -99.1332,
            file_path: null,
            file_hash: null,
            advance_id: null,
            custom_data: {}
        };

        console.log('Sending payload:', payload);
        const res = await fetch(`${baseURL}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('Error Response:', res.status, data);
        } else {
            console.log('Success:', data);
        }
    } catch (error) {
        console.error('Network/Script Error:', error);
    }
})();
