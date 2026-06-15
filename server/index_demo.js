const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// --- IN-MEMORY DATA (DEMO MODE) ---
let products = [
    { id: 1, name: 'Espresso', category: 'Coffee', price: 2.50, image_url: 'https://images.unsplash.com/photo-1510591509098-f40962dbe5f9?auto=format&fit=crop&q=80&w=200', is_available: true },
    { id: 2, name: 'Cappuccino', category: 'Coffee', price: 3.50, image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e569?auto=format&fit=crop&q=80&w=200', is_available: true },
    { id: 3, name: 'Latte', category: 'Coffee', price: 3.75, image_url: 'https://images.unsplash.com/photo-1561882468-9110e03e0f7e?auto=format&fit=crop&q=80&w=200', is_available: true },
    { id: 4, name: 'Croissant', category: 'Dessert', price: 2.00, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=200', is_available: true }
];

let tables = [
    { id: 1, name: 'Table 1', status: 'available' },
    { id: 2, name: 'Table 2', status: 'available' },
    { id: 3, name: 'Table 3', status: 'available' },
    { id: 4, name: 'Table 4', status: 'available' }
];

let orders = [];
let nextOrderId = 1;

// --- API Routes ---

// Get All Products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Create Product
app.post('/api/products', (req, res) => {
    const { name, category, price, image_url } = req.body;
    const newProduct = {
        id: products.length + 1,
        name, category, price, image_url,
        is_available: true
    };
    products.push(newProduct);
    res.json(newProduct);
});

// Delete Product
app.delete('/api/products/:id', (req, res) => {
    products = products.filter(p => p.id !== parseInt(req.params.id));
    res.json({ message: 'Deleted' });
});

// Get Tables
app.get('/api/tables', (req, res) => {
    res.json(tables);
});

// Create Table
app.post('/api/tables', (req, res) => {
    const { name } = req.body;
    const newTable = { id: tables.length + 1, name, status: 'available' };
    tables.push(newTable);
    res.json(newTable);
});

// Create Order (Captain -> Cashier)
app.post('/api/orders', (req, res) => {
    const { table_id, items, total } = req.body;

    const newOrder = {
        id: nextOrderId++,
        table_id,
        status: 'pending',
        total,
        items,
        created_at: new Date()
    };

    orders.push(newOrder);

    // Update Table Status
    if (table_id) {
        const table = tables.find(t => t.id === table_id);
        if (table) table.status = 'occupied';
    }

    io.emit('new-order', newOrder);
    res.json(newOrder);
});

// Get Orders (For Cashier initialization)
app.get('/api/orders', (req, res) => {
    res.json(orders);
});

// Pay Order (Cashier)
app.post('/api/orders/:id/pay', (req, res) => {
    const order = orders.find(o => o.id === parseInt(req.params.id));
    if (order) {
        order.status = 'paid';
        if (order.table_id) {
            const table = tables.find(t => t.id === order.table_id);
            if (table) table.status = 'available';
        }
        io.emit('order-paid', { id: order.id });
        res.json({ message: 'Paid' });
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

// --- Socket.io ---
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`DEMO SERVER running on http://localhost:${PORT}`);
    console.log(`(In-Memory Mode: Data resets on restart)`);
});
