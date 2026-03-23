const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

(async () => {
    try {
        console.log('1. Creating Advance Request...');
        const createRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/advances/request', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { user_id: 2, amount: 555, notes: 'Verification Script Advance' });

        console.log('Create Status:', createRes.status);
        console.log('Create Body:', createRes.body);

        if (createRes.status !== 201) throw new Error('Failed to create advance');
        const advanceId = createRes.body.id;

        console.log('\n2. Fetching Pending Advances for Manager ID 1...');
        const listRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/approvals/pending-advances?manager_id=1', method: 'GET'
        });

        console.log('List Status:', listRes.status);
        const pending = listRes.body;
        console.log('Pending Count:', pending.length);
        const myAdvance = pending.find(p => p.id === advanceId);

        if (!myAdvance) throw new Error('Newly created advance not found in pending list');
        console.log('Found Advance:', myAdvance.id, myAdvance.notes);

        console.log('\n3. Approving Advance...');
        const approveRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/advances/${advanceId}/approve`, method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        }, { status: 'Aprobado', amount_approved: 555, notes: 'API Verified' });

        console.log('Approve Status:', approveRes.status);
        console.log('Approve Body:', approveRes.body);

        if (approveRes.status !== 200) throw new Error('Failed to approve advance');

        console.log('\n4. Verifying Status Update...');
        // We can check /api/advances?user_id=2 (User's view)
        const verifyRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/advances?user_id=2`, method: 'GET'
        });
        const user_advances = verifyRes.body;
        const verified = user_advances.find(a => a.id === advanceId);
        console.log('Final Status:', verified.status, 'Approved Amount:', verified.amount_approved);

        if (verified.status !== 'Aprobado') throw new Error('Status not updated');

        console.log('\nSUCCESS: Advance Approval Flow Verified!');

    } catch (error) {
        console.error('\nFAILURE:', error.message);
        process.exit(1);
    }
})();
