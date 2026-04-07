const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Flexiblidad de rutas para CPanel
app.use((req, res, next) => {
    const projectPrefix = '/cajachica-api';
    if (req.url.startsWith(projectPrefix)) {
        req.url = req.url.substring(projectPrefix.length) || '/';
    }
    next();
});

// Rutas Montadas
const routeList = [
    { path: '/ocr', route: require('./routes/ocr') },
    { path: '/advances', route: require('./routes/advances') },
    { path: '/expenses', route: require('./routes/expenses') },
    { path: '/admin', route: require('./routes/admin') },
    { path: '/finance', route: require('./routes/finance') },
    { path: '/catalogs', route: require('./routes/catalogs') },
    { path: '/users', route: require('./routes/users') },
    { path: '/approvals', route: require('./routes/approvals') },
    { path: '/roles', route: require('./routes/roles') },
    { path: '/settings', route: require('./routes/settings') },
];

routeList.forEach(({ path, route }) => {
    app.use(`/api${path}`, route);
    app.use(path, route);
});

app.get('/', (req, res) => {
    res.json({ message: 'Induwell API Online' });
});

// Ruta de diagnóstico para probar la conexión a la base de datos
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 as result');
        res.json({ success: true, db: rows[0].result, message: 'Conexión a MySQL exitosa' });
    } catch (e) {
        res.status(500).json({
            success: false,
            error: e.message,
            code: e.code,
            tip: 'Verifica el usuario, contraseña y nombre de BD en el archivo .env de CPanel'
        });
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
