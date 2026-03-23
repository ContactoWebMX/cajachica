const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- Custom Fields ---

// GET /api/admin/custom-fields
router.get('/custom-fields', async (req, res) => {
    try {
        const [fields] = await db.execute('SELECT * FROM custom_fields');
        res.json(fields);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/admin/custom-fields
router.post('/custom-fields', async (req, res) => {
    const { name, label, type, options, required } = req.body;
    try {
        await db.execute(
            'INSERT INTO custom_fields (name, label, type, options, required) VALUES (?, ?, ?, ?, ?)',
            [name, label, type, JSON.stringify(options || []), required ? 1 : 0]
        );
        res.status(201).json({ message: 'Custom field created' });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE /api/admin/custom-fields/:id
router.delete('/custom-fields/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM custom_fields WHERE id = ?', [req.params.id]);
        res.json({ message: 'Custom field deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// --- System Logs ---

// GET /api/admin/logs
router.get('/logs', async (req, res) => {
    try {
        const [logs] = await db.execute(
            `SELECT l.*, u.name as user_name 
             FROM system_logs l 
             LEFT JOIN users u ON l.user_id = u.id 
             ORDER BY l.created_at DESC LIMIT 100`
        );
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Settings ---

// GET /api/admin/settings
router.get('/settings', async (req, res) => {
    try {
        const [settings] = await db.execute('SELECT setting_key, setting_value FROM system_settings');
        const config = {};
        settings.forEach(s => {
            // Mask password
            config[s.setting_key] = s.setting_key === 'smtp_pass' ? '********' : s.setting_value;
        });
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/admin/settings
router.post('/settings', async (req, res) => {
    const settings = req.body; // Expects object { key: value }
    try {
        for (const [key, value] of Object.entries(settings)) {
            // Don't save masked password if sent back unchanged
            if (key === 'smtp_pass' && value === '********') continue;

            await db.execute(
                'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, value, value]
            );
        }
        res.json({ message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
