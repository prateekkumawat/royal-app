const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { getPool } = require('./db');

const app = express();
const PORT = process.env.PORT || 5003;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026';

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'order-service', status: 'UP', timestamp: new Date() });
});

// Middleware for JWT Authentication
function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Create New Order
app.post('/api/orders', authenticateUser, async (req, res) => {
    let connection;
    try {
        const { items, shipping_address, total_amount } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain at least one item' });
        }
        if (!shipping_address) {
            return res.status(400).json({ error: 'Shipping address is required' });
        }

        const pool = await getPool();
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Calculate or verify total amount
        const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const finalTotal = total_amount || calculatedTotal;

        // Insert Order
        const [orderResult] = await connection.execute(`
            INSERT INTO orders (user_id, user_email, total_amount, shipping_address, status)
            VALUES (?, ?, ?, ?, 'PROCESSING')
        `, [req.user.id, req.user.email, finalTotal, shipping_address]);

        const orderId = orderResult.insertId;

        // Insert Order Items
        for (const item of items) {
            await connection.execute(`
                INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
                VALUES (?, ?, ?, ?, ?)
            `, [orderId, item.product_id || item.id, item.name || item.product_name, item.price, item.quantity]);
        }

        await connection.commit();

        res.status(201).json({
            message: 'Order placed successfully',
            orderId,
            status: 'PROCESSING',
            total_amount: finalTotal
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Failed to process order' });
    } finally {
        if (connection) connection.release();
    }
});

// Get User Orders
app.get('/api/orders', authenticateUser, async (req, res) => {
    try {
        const pool = await getPool();
        let ordersQuery = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
        let queryParams = [req.user.id];

        if (req.user.role === 'admin') {
            ordersQuery = 'SELECT * FROM orders ORDER BY created_at DESC';
            queryParams = [];
        }

        const [orders] = await pool.execute(ordersQuery, queryParams);

        // Fetch items for each order
        for (let order of orders) {
            const [items] = await pool.execute(
                'SELECT * FROM order_items WHERE order_id = ?',
                [order.id]
            );
            order.items = items;
        }

        res.json(orders);
    } catch (err) {
        console.error('Fetch orders error:', err);
        res.status(500).json({ error: 'Failed to fetch user orders' });
    }
});

// Get Order Details by ID
app.get('/api/orders/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();

        const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];
        if (order.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [id]);
        order.items = items;

        res.json(order);
    } catch (err) {
        console.error('Fetch order details error:', err);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

app.listen(PORT, () => {
    console.log(`[Order Service] Running on port ${PORT}`);
});
