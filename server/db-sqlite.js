const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

let db;

async function init() {
    if (db) return db;

    const dbPath = path.resolve(__dirname, 'database.sqlite');

    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec('PRAGMA foreign_keys = ON;');
    await createSchema(db);

    return db;
}

const wrapper = {
    async query(sql, params = []) {
        const _db = await init();

        // Simple heuristic for differentiating query type
        const trimSql = sql.trim().toUpperCase();
        const isSelect = trimSql.startsWith('SELECT') || trimSql.startsWith('WITH');

        if (isSelect) {
            const rows = await _db.all(sql, params);
            return [rows, []];
        } else {
            const result = await _db.run(sql, params);
            // Simulate MySQL result object
            return [{
                insertId: result.lastID,
                affectedRows: result.changes,
                changedRows: result.changes
            }, []];
        }
    },

    async getConnection() {
        const _db = await init();
        return {
            ...wrapper,
            async beginTransaction() { await _db.run('BEGIN TRANSACTION'); },
            async commit() { await _db.run('COMMIT'); },
            async rollback() { await _db.run('ROLLBACK'); },
            release() { }
        };
    },

    promise() { return this; }
};

async function createSchema(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          image_url TEXT,
          description TEXT,
          name_ckb TEXT,
          barcode TEXT,
          is_available BOOLEAN DEFAULT TRUE,
          track_stock BOOLEAN DEFAULT FALSE,
          stock_quantity INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS captains (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tables (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          captain_id INTEGER,
          status TEXT CHECK(status IN ('available', 'occupied')) DEFAULT 'available',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_id INTEGER,
          status TEXT CHECK(status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
          total DECIMAL(10,2) DEFAULT 0.00,
          payment_method TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS cashiers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS debts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          order_id INTEGER,
          status TEXT CHECK(status IN ('unpaid', 'paid')) DEFAULT 'unpaid',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          category TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Dynamically alter existing products table if needed
    try {
        await db.exec('ALTER TABLE products ADD COLUMN track_stock BOOLEAN DEFAULT 0;');
    } catch (e) {
        // Column might already exist
    }
    try {
        await db.exec('ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;');
    } catch (e) {
        // Column might already exist
    }

    // Seed if empty products
    const row = await db.get('SELECT count(*) as count FROM products');
    if (row.count === 0) {
        // Simple seed
        await db.run("INSERT INTO products (name, category, price, image_url) VALUES ('Espresso', 'Coffee', 2.50, ''), ('Latte', 'Coffee', 3.75, '')");
        await db.run("INSERT INTO tables (name) VALUES ('Table 1'), ('Table 2'), ('Table 3'), ('Table 4')");
        await db.run("INSERT INTO cashiers (name, code) VALUES ('Cashier 1', '1234')");
        await db.run("INSERT INTO captains (name, code) VALUES ('Captain 1', '1234')");
    }
}

module.exports = wrapper;
