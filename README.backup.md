# Coffee Shop POS - Setup Instructions

## 1. Prerequisites
- Node.js (Installed)
- MySQL Server (Installed & Running)

## 2. Database Setup
1. Open your MySQL Client (Workbench, Command Line, etc.).
2. Create a new database or use an existing one.
3. Run the script located in `server/schema.sql`.
   - This will create `products`, `tables`, `orders` tables.
   - It will also insert some dummy data.

## 3. Server Setup (Backend)
1. Open a terminal.
2. Navigate to the server folder:
   ```bash
   cd server
   ```
3. Create a `.env` file (optional if using defaults, otherwise configure DB):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=coffee_shop_pos
   ```
4. Install dependencies (if not done):
   ```bash
   npm install
   ```
5. Start the server:
   ```bash
   node index.js
   ```
   > Server should run on port 3000.

## 4. Client Setup (Frontend)
1. Open a **new** terminal.
2. Navigate to the client folder:
   ```bash
   cd client
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the React app:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:5173`.

## 5. Usage
- **Captain View** (`/captain`): Select a table, add items, send order.
- **Cashier View** (`/cashier`): View incoming real-time orders, mark as paid.
- **Admin View** (`/admin/products`): Add or edit menu items.
