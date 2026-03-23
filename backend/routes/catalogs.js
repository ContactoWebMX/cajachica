const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper for standardized CRUD
const crud = (table) => ({
    getAll: async (req, res) => {
        try {
            const [rows] = await db.query(`SELECT * FROM ${table} WHERE active = TRUE ORDER BY name`);
            res.json(rows);
        } catch (error) {
            console.error(`Error fetching ${table}:`, error);
            res.status(500).json({ error: 'Database error' });
        }
    },
    create: async (req, res) => {
        const { name, description, code, cost_center_id } = req.body;
        try {
            let query = '', params = [];
            if (table === 'expense_categories') {
                query = 'INSERT INTO expense_categories (name, description) VALUES (?, ?)';
                params = [name, description];
            } else if (table === 'projects') {
                query = 'INSERT INTO projects (name, description) VALUES (?, ?)';
                params = [name, description || null];
            } else if (table === 'cost_centers') {
                query = 'INSERT INTO cost_centers (name, code) VALUES (?, ?)';
                params = [name, code];
            } else if (table === 'departments') {
                query = 'INSERT INTO departments (name, cost_center_id) VALUES (?, ?)';
                params = [name, cost_center_id || null];
            }

            const [result] = await db.execute(query, params);
            res.status(201).json({ id: result.insertId, message: 'Created successfully' });
        } catch (error) {
            console.error(`Error creating in ${table}:`, error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Duplicate entry' });
            }
            res.status(500).json({ error: 'Database error' });
        }
    },
    update: async (req, res) => {
        const { id } = req.params;
        const { name, description, code, cost_center_id, active } = req.body;
        try {
            let updates = [];
            let params = [];

            if (name) { updates.push('name = ?'); params.push(name); }
            if (description !== undefined && (table === 'expense_categories' || table === 'projects')) { updates.push('description = ?'); params.push(description); }
            if (code !== undefined && table === 'cost_centers') { updates.push('code = ?'); params.push(code); }
            if (cost_center_id !== undefined && table === 'departments') { updates.push('cost_center_id = ?'); params.push(cost_center_id || null); }
            if (active !== undefined) { updates.push('active = ?'); params.push(active); }

            if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

            params.push(id);
            await db.execute(`UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`, params);
            res.json({ message: 'Updated successfully' });
        } catch (error) {
            console.error(`Error updating ${table}:`, error);
            res.status(500).json({ error: 'Database error' });
        }
    },
    delete: async (req, res) => {
        const { id } = req.params;
        try {
            // Soft delete
            await db.execute(`UPDATE ${table} SET active = FALSE WHERE id = ?`, [id]);
            res.json({ message: 'Deleted (soft) successfully' });
        } catch (error) {
            console.error(`Error deleting from ${table}:`, error);
            res.status(500).json({ error: 'Database error' });
        }
    }
});

// Categories Routes
const categories = crud('expense_categories');
router.get('/categories', categories.getAll);
router.post('/categories', categories.create);
router.put('/categories/:id', categories.update);
router.delete('/categories/:id', categories.delete);

// Cost Centers Routes
const costCenters = crud('cost_centers');
router.get('/cost-centers', costCenters.getAll);
router.post('/cost-centers', costCenters.create);
router.put('/cost-centers/:id', costCenters.update);
router.delete('/cost-centers/:id', costCenters.delete);

// Departments Routes
const departments = crud('departments');
router.get('/departments', departments.getAll);
router.post('/departments', departments.create);
router.put('/departments/:id', departments.update);
router.delete('/departments/:id', departments.delete);

// Projects Routes
const projects = crud('projects');
router.get('/projects', projects.getAll);
router.post('/projects', projects.create);
router.put('/projects/:id', projects.update);
router.delete('/projects/:id', projects.delete);

// Companies Routes (custom handler to support rfc field)
router.get('/companies', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM companies WHERE active = TRUE ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Database error' });
    }
});
router.post('/companies', async (req, res) => {
    const { name, rfc, description } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
    try {
        const [result] = await db.execute(
            'INSERT INTO companies (name, rfc, description) VALUES (?, ?, ?)',
            [name, rfc || null, description || null]
        );
        res.status(201).json({ id: result.insertId, message: 'Empresa creada' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una empresa con ese nombre' });
        console.error('Error creating company:', error);
        res.status(500).json({ error: 'Database error' });
    }
});
router.put('/companies/:id', async (req, res) => {
    const { id } = req.params;
    const { name, rfc, description, active } = req.body;
    try {
        const updates = [], params = [];
        if (name) { updates.push('name = ?'); params.push(name); }
        if (rfc !== undefined) { updates.push('rfc = ?'); params.push(rfc || null); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description || null); }
        if (active !== undefined) { updates.push('active = ?'); params.push(active); }
        if (updates.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });
        params.push(id);
        await db.execute(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json({ message: 'Empresa actualizada' });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ error: 'Database error' });
    }
});
router.delete('/companies/:id', async (req, res) => {
    try {
        await db.execute('UPDATE companies SET active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Empresa desactivada' });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
