const db = require('./db');

(async () => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        console.log('Database connection successful! Solution:', rows[0].solution);
        process.exit(0);
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
})();
