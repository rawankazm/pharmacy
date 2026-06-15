CREATE DATABASE IF NOT EXISTS market_pos;
USE market_pos;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  description TEXT,
  name_ckb TEXT,
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

CREATE TABLE IF NOT EXISTS tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  captain_id INT,
  status ENUM('available', 'occupied') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT,
  status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
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

-- Seed Data --
INSERT INTO products (name, category, price, image_url) VALUES 
('Espresso', 'Coffee', 2.50, 'https://images.unsplash.com/photo-1510591509098-f40962dbe5f9?auto=format&fit=crop&q=80&w=200'),
('Cappuccino', 'Coffee', 3.50, 'https://images.unsplash.com/photo-1572442388796-11668a67e569?auto=format&fit=crop&q=80&w=200'),
('Latte', 'Coffee', 3.75, 'https://images.unsplash.com/photo-1561882468-9110e03e0f7e?auto=format&fit=crop&q=80&w=200'),
('Croissant', 'Dessert', 2.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=200');

INSERT INTO tables (name) VALUES ('Table 1'), ('Table 2'), ('Table 3'), ('Table 4');

CREATE TABLE IF NOT EXISTS cashiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  order_id INT,
  status VARCHAR(20) DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

INSERT INTO cashiers (name, code) VALUES ('Cashier 1', '1234');
