const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configure Multer for file upload
const upload = multer({ dest: 'uploads/' });

// Helper: Calculate SHA-256 Hash
const calculateFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
};

// POST /api/ocr/upload-ticket
router.post('/upload-ticket', upload.single('ticket'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;

    try {
        // 1. Calculate Hash
        const fileHash = await calculateFileHash(filePath);

        // 2. Perform OCR
        const { data: { text } } = await Tesseract.recognize(filePath, 'eng+spa', {
            logger: m => console.log(m)
        });

        // 3. Extract Data (Basic Regex Patterns - Enhance based on real tickets)
        // Amount: Looks for patterns like $123.45 or 123.45
        const amountMatch = text.match(/[\$\s]?(\d{1,3}(?:,\d{3})*\.\d{2})/);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

        // RFC: Mexican RFC pattern (4 letters, 6 digits, 3 alphanumeric)
        const rfcMatch = text.match(/[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}/);
        const rfc = rfcMatch ? rfcMatch[0] : null;

        // Date: DD/MM/YYYY or YYYY-MM-DD
        const dateMatch = text.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})|(\d{4}[-\/]\d{2}[-\/]\d{2})/);
        let date = dateMatch ? dateMatch[0] : null;

        // Return extracted data
        res.json({
            success: true,
            hash: fileHash,
            extracted: {
                amount,
                rfc,
                date,
                raw_text: text // For debugging
            },
            temp_path: filePath // Frontend should send this back when saving expense
        });

    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ error: 'Failed to process ticket' });
    }
});

module.exports = router;
