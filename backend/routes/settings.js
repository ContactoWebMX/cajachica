const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for Logo Upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Always save as 'app-logo' + extension to avoiding piling up files, or unique name
        // For simplicity and caching avoidance, maybe unique name is better, but let's stick to unique time
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// GET settings
router.get('/', async (req, res) => {
    try {
        const [settings] = await db.query('SELECT * FROM app_settings');
        // Convert to key-value object
        const settingsObj = settings.reduce((acc, curr) => {
            acc[curr.setting_key] = curr.setting_value;
            return acc;
        }, {});
        res.json(settingsObj);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST settings (Update)
router.post('/', upload.single('logo'), async (req, res) => {
    const settings = req.body;
    const file = req.file;

    try {
        const queries = [];

        // Save Logo URL if uploaded
        if (file) {
            // Construct absolute URL or relative path
            // In server.js: app.use('/uploads', express.static('uploads'));
            // So URL is /uploads/filename
            const logoUrl = `/uploads/${file.filename}`;
            queries.push(
                db.execute(
                    'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                    ['logo_url', logoUrl, logoUrl]
                )
            );
        }

        // Save other settings
        Object.keys(settings).forEach(key => {
            queries.push(
                db.execute(
                    'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                    [key, settings[key], settings[key]]
                )
            );
        });

        await Promise.all(queries);
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT settings (Update via JSON)
router.put('/', async (req, res) => {
    const settings = req.body;
    try {
        const queries = [];
        Object.keys(settings).forEach(key => {
            queries.push(
                db.execute(
                    'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                    [key, settings[key], settings[key]]
                )
            );
        });
        await Promise.all(queries);
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
