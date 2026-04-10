/**
 * INDUWELL CLOUD-CASH - HARDENED PRODUCTION SERVER V2.3.0
 * Environment: Multi-Domain Production (CPanel)
 */
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// --- SECCIÓN 2: SEGURIDAD Y CORS DINÁMICO REFORZADO ---
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false
}));

app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://contactoweb.mx',
        'https://caja.contactoweb.mx'
    ];

    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        // Fallback para seguridad si no hay origin (peticiones directas)
        res.header('Access-Control-Allow-Origin', 'https://caja.contactoweb.mx');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
        return res.status(204).send();
    }
    next();
});

// --- SECCIÓN 3: MIDDLEWARES BASE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SECCIÓN 4: PROTECCIÓN CONTRA BRUTE-FORCE ---
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // 20 intentos por IP
    message: { message: "Demasiados intentos. Por favor espere 15 minutos." }
});
app.use('/users/login', loginLimiter);

// --- SECCIÓN 5: RUTAS ---
const db = require('./config/db');
app.use('/users', require('./routes/users'));
app.use('/catalogs', require('./routes/catalogs'));
app.use('/settings', require('./routes/settings'));
app.use('/advances', require('./routes/advances'));
app.use('/expenses', require('./routes/expenses'));
app.use('/approvals', require('./routes/approvals'));
app.use('/finance', require('./routes/finance'));
app.use('/admin', require('./routes/admin'));
app.use('/roles', require('./routes/roles'));
app.use('/ocr', require('./routes/ocr'));

// --- SECCIÓN 6: ARCHIVOS ESTÁTICOS ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// --- SECCIÓN 7: ENDPOINTS DE DIAGNÓSTICO ---
app.get('/', (req, res) => res.json({ message: "Induwell API Online - Hardened Mode V2.3" }));

app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({ success: true, db: rows[0].result, message: "MySQL Stack Connected" });
    } catch (error) {
        res.status(500).json({ success: false, error: "Database Link Failed" });
    }
});

// --- SECCIÓN 8: MANEJO DE ERRORES SILENCIOSO ---
app.use((err, req, res, next) => {
    console.error(`[CRITICAL ERROR]: ${err.stack}`);
    res.status(500).json({ message: "Internal Server Error" });
});

// --- SECCIÓN 9: ARRANQUE ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`[INFRASTRUCTURE]: Server listening on port ${PORT}`);
});
