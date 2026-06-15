const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        console.log("Connecting to MySQL server (no DB selected)...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD
        });

        console.log("Connected! Creating database if it doesn't exist...");
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'coffee_shop_pos'}`);
        console.log(`Database '${process.env.DB_NAME || 'coffee_shop_pos'}' created or already exists.`);

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to create DB:", error);
        process.exit(1);
    }
})();
