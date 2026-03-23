const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/roles
router.get('/', async (req, res) => {
    try {
        const [roles] = await db.query('SELECT * FROM roles WHERE active = TRUE');
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/roles
router.post('/', async (req, res) => {
    const { name, description } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO roles (name, description) VALUES (?, ?)',
            [name, description]
        );
        res.status(201).json({ id: result.insertId, message: 'Role created' });
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /api/roles/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, active } = req.body;
    try {
        let updates = [];
        let params = [];
        if (name) { updates.push('name = ?'); params.push(name); }
        if (description) { updates.push('description = ?'); params.push(description); }
        if (active !== undefined) { updates.push('active = ?'); params.push(active); }

        if (updates.length > 0) {
            params.push(id);
            await db.execute(`UPDATE roles SET ${updates.join(', ')} WHERE id = ?`, params);
        }
        res.json({ message: 'Role updated' });
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE /api/roles/:id (Soft delete)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('UPDATE roles SET active = FALSE WHERE id = ?', [id]);
        res.json({ message: 'Role deleted' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
