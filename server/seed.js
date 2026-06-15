const db = require('./db');
require('dotenv').config();

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  description TEXT,
  name_ckb VARCHAR(255),
  barcode VARCHAR(100),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS captains (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cashiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  captain_id INT,
  status VARCHAR(20) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT,
  status VARCHAR(20) DEFAULT 'pending',
  total DECIMAL(10,2) DEFAULT 0.00,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`;

const SEED_PRODUCTS = `
INSERT IGNORE INTO products (id, name, category, name_ckb, barcode, price, image_url) VALUES 
(1, 'Lays Potato Chips', 'Snacks & Sweets', 'چپسی لایس', '8690624101234', 1000.00, 'https://images.unsplash.com/photo-1566478989037-eec170784d20?auto=format&fit=crop&q=80&w=200'),
(2, 'Pepsi Cola 250ml', 'Beverages', 'پیپسی ٢٥٠ مل', '012000000133', 500.00, 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&q=80&w=200'),
(3, 'Almarai Fresh Milk 1L', 'Dairy & Cheese', 'شیری تازەی مەراعی ١ لتر', '6281007000109', 2000.00, '/milk.png'),
(4, 'Basmati Rice 1kg', 'Pantry & Grains', 'برنجی باسمەتی ١ کگم', '8906010061234', 2500.00, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=200'),
(5, 'Toast Bread White', 'Bakery', 'تۆستی سپی', '6223000412345', 1500.00, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=200'),
(6, 'Fairy Dish Soap 1L', 'Household & Cleaning', 'زاهی فێری ١ لتر', '5410076964264', 2250.00, 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=200');
`;

const SEED_CAPTAINS = `
INSERT IGNORE INTO captains (id, name, code) VALUES 
(1, 'Clerk Jack', '1234'),
(2, 'Clerk Sarah', '5678');
`;

const SEED_CASHIERS = `
INSERT IGNORE INTO cashiers (id, name, code) VALUES 
(1, 'Cashier Main', '1010');
`;

const SEED_TABLES = `
INSERT IGNORE INTO tables (id, name, captain_id) VALUES 
(1, 'Cart 1', 1), (2, 'Cart 2', 1), (3, 'Cart 3', 2), (4, 'Cart 4', 2), (5, 'Cart 5', null);
`;

(async () => {
  try {
    console.log("Creating Tables...");
    const statements = SCHEMA.split(';').filter(s => s.trim());
    for (const statement of statements) {
      await db.query(statement);
    }

    console.log("Seeding Products...");
    await db.query(SEED_PRODUCTS);

    console.log("Seeding Captains...");
    await db.query(SEED_CAPTAINS);

    console.log("Seeding Cashiers...");
    await db.query(SEED_CASHIERS);

    console.log("Seeding Tables...");
    await db.query(SEED_TABLES);

    console.log("✅ Seed Complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Failed:", error);
    process.exit(1);
  }
})();
