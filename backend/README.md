# Backend Setup Instructions

## 1. Environment Setup

The backend is located in the `backend/` directory.
It requires a MySQL or MariaDB database.

1.  Copy `backend/.env` to `backend/.env.local` (optional, or just edit `.env`).
2.  Update the `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `.env` with your database credentials.

## 2. Database Creation

Run the SQL script `backend/schema.sql` to create the necessary tables.

```bash
mysql -u your_user -p < backend/schema.sql
```

## 3. Running the Server

Install dependencies and run the server:

```bash
cd backend
npm install
node server.js
```

The server will try to connect to the database on startup.
