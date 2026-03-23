const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Handle URL-encoded data

// Routes
app.use('/api/ocr', require('./routes/ocr'));
app.use('/api/advances', require('./routes/advances'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/catalogs', require('./routes/catalogs'));
app.use('/api/users', require('./routes/users'));
app.use('/api/approvals', require('./routes/approvals'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/settings', require('./routes/settings'));


app.get('/', (req, res) => {
    res.json({ message: 'Induwell Cloud-Cash API is running' });
});

app.use('/uploads', express.static('uploads')); // Serve uploaded files

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
