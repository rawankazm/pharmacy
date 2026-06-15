const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Vite default port
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// --- API Routes ---

// Get All Products
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Product
app.post('/api/products', async (req, res) => {
    const { name, category, price, image_url, name_ckb, barcode, track_stock, stock_quantity, is_available } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO products (name, category, price, image_url, name_ckb, barcode, track_stock, stock_quantity, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, category, price, image_url, name_ckb || name, barcode || '', track_stock ? 1 : 0, stock_quantity || 0, is_available !== false ? 1 : 0]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Product
app.put('/api/products/:id', async (req, res) => {
    const { name, category, price, image_url, name_ckb, barcode, track_stock, stock_quantity, is_available } = req.body;
    try {
        await db.query(
            'UPDATE products SET name = ?, category = ?, price = ?, image_url = ?, name_ckb = ?, barcode = ?, track_stock = ?, stock_quantity = ?, is_available = ? WHERE id = ?',
            [name, category, price, image_url, name_ckb || name, barcode || '', track_stock ? 1 : 0, stock_quantity || 0, is_available !== false ? 1 : 0, req.params.id]
        );
        res.json({ id: req.params.id, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Tables
app.get('/api/tables', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, c.name as captain_name 
            FROM tables t 
            LEFT JOIN captains c ON t.captain_id = c.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Table
app.post('/api/tables', async (req, res) => {
    const { name } = req.body;
    try {
        const [result] = await db.query('INSERT INTO tables (name) VALUES (?)', [name]);
        res.json({ id: result.insertId, name, status: 'available' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Table
app.delete('/api/tables/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM tables WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Captains Routes ---

// Get All Captains
app.get('/api/captains', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM captains');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Captain
app.post('/api/captains', async (req, res) => {
    const { name, code } = req.body;
    try {
        const [result] = await db.query('INSERT INTO captains (name, code) VALUES (?, ?)', [name, code]);
        res.json({ id: result.insertId, name, code });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Captain
app.put('/api/captains/:id', async (req, res) => {
    const { name, code } = req.body;
    try {
        await db.query('UPDATE captains SET name = ?, code = ? WHERE id = ?', [name, code, req.params.id]);
        res.json({ id: req.params.id, name, code });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Captain
app.delete('/api/captains/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM captains WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Cashiers Routes ---

// Get All Cashiers
app.get('/api/cashiers', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cashiers');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Cashier
app.post('/api/cashiers', async (req, res) => {
    const { name, code } = req.body;
    try {
        const [result] = await db.query('INSERT INTO cashiers (name, code) VALUES (?, ?)', [name, code]);
        res.json({ id: result.insertId, name, code });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Cashier
app.put('/api/cashiers/:id', async (req, res) => {
    const { name, code } = req.body;
    try {
        await db.query('UPDATE cashiers SET name = ?, code = ? WHERE id = ?', [name, code, req.params.id]);
        res.json({ id: req.params.id, name, code });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Cashier
app.delete('/api/cashiers/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM cashiers WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Assign Captain to Table
app.post('/api/tables/:id/assign', async (req, res) => {
    const { captain_id } = req.body;
    try {
        await db.query('UPDATE tables SET captain_id = ? WHERE id = ?', [captain_id, req.params.id]);
        res.json({ message: 'Assigned', tableId: req.params.id, captainId: captain_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Order (Captain -> Cashier)
app.post('/api/orders', async (req, res) => {
    const { table_id, items, total } = req.body; // items = [{product_id, quantity, price}]

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Create Order
        const [orderResult] = await connection.query(
            'INSERT INTO orders (table_id, total, status) VALUES (?, ?, "pending")',
            [table_id, total]
        );
        const orderId = orderResult.insertId;

        // 2. Create Order Items
        for (const item of items) {
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        // 3. Update Table Status
        if (table_id) {
            await connection.query('UPDATE tables SET status = "occupied" WHERE id = ?', [table_id]);
        }

        await connection.commit();

        // 4. Emit Real-time Event
        const fullOrder = { id: orderId, table_id, total, status: 'pending', items, created_at: new Date() };
        io.emit('new-order', fullOrder);

        res.json(fullOrder);
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Pay Order (Cashier)
app.post('/api/orders/:id/pay', async (req, res) => {
    const { table_id, payment_method } = req.body;
    try {
        await db.query('UPDATE orders SET status = "paid", payment_method = ? WHERE id = ?', [payment_method || 'cash', req.params.id]);
        if (table_id) {
            await db.query('UPDATE tables SET status = "available" WHERE id = ?', [table_id]);
        }
        io.emit('order-paid', { id: req.params.id });
        res.json({ message: 'Paid' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get All Orders (Active/Pending)
app.get('/api/orders', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT o.*, 
            json_group_array(
                json_object(
                    'product_id', oi.product_id,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'name', p.name,
                    'image_url', p.image_url
                )
            ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.status = 'pending'
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);
        // Parse items from JSON string if necessary
        const orders = rows.map(row => ({
            ...row,
            items: (typeof row.items === 'string' ? JSON.parse(row.items) : row.items) || []
        }));
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Order
app.put('/api/orders/:id', async (req, res) => {
    const { items, total_amount } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Update Order Total
        await connection.query('UPDATE orders SET total = ? WHERE id = ?', [total_amount, req.params.id]);

        // Re-create items (simplest strategy for now: delete all and re-insert)
        await connection.query('DELETE FROM order_items WHERE order_id = ?', [req.params.id]);

        for (const item of items) {
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [req.params.id, item.product_id, item.quantity, item.price]
            );
        }

        await connection.commit();
        res.json({ message: 'Updated', id: req.params.id });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Get Sales (Paid Orders)
app.get('/api/sales', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT o.*, 
            json_group_array(
                json_object(
                    'product_id', oi.product_id,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'name', p.name
                )
            ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.status = 'paid'
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);
        const sales = rows.map(row => ({
            ...row,
            items: (typeof row.items === 'string' ? JSON.parse(row.items) : row.items) || []
        }));
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Expenses ---

// Get All Expenses
app.get('/api/expenses', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM expenses ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Expense
app.post('/api/expenses', async (req, res) => {
    const { description, amount, category } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO expenses (description, amount, category) VALUES (?, ?, ?)',
            [description, amount, category]
        );
        res.json({ id: result.insertId, ...req.body, created_at: new Date() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Expense
app.delete('/api/expenses/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Socket.io ---
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
