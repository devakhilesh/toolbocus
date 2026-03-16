

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let connection;

async function initDB() {

    const dbName = process.env.DB_NAME;

    const tempConnection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
        multipleStatements: true
    });

    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    await tempConnection.query(`USE ${dbName}`);

    // check if tables exist
    const [tables] = await tempConnection.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ?
    `, [dbName]);

    if (tables.length === 0) {

        console.log("No tables found. Running toolbocs.sql...");

        const sqlPath = path.join(__dirname, '..', 'toolbocs.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await tempConnection.query(sql);

        console.log("Tables created successfully");

    } else {

        console.log("Tables already exist");

    }

    await tempConnection.end();

    connection = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: dbName,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10
    });

    console.log("Database connected successfully");

}

initDB();

module.exports = {
    query: (...args) => connection.query(...args)
};