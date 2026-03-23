const fs = require('fs');
const crypto = require('crypto');
const db = require('../config/db');
const path = require('path');

// Helper: Calculate SHA-256 Hash
const calculateFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) return resolve(null);

        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
};

const verifyFileIntegrity = async () => {
    try {
        const [expenses] = await db.execute('SELECT id, file_path, file_hash FROM expenses WHERE file_path IS NOT NULL');
        const compromised = [];

        for (const expense of expenses) {
            // Adjust path if stored relative
            const absolutePath = path.resolve(__dirname, '..', expense.file_path); // Assuming file_path is relative to backend root or uploads/

            const currentHash = await calculateFileHash(absolutePath);

            if (!currentHash) {
                compromised.push({ id: expense.id, issue: 'FILE_MISSING' });
            } else if (currentHash !== expense.file_hash) {
                compromised.push({ id: expense.id, issue: 'HASH_MISMATCH', stored: expense.file_hash, current: currentHash });
            }
        }

        return compromised;

    } catch (error) {
        console.error('Audit Error:', error);
        throw error;
    }
};

module.exports = { verifyFileIntegrity };
