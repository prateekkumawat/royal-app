const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { getPool } = require('./db');

const app = express();
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026';

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'product-service', status: 'UP', timestamp: new Date() });
});

// Get Categories
app.get('/api/categories', async (req, res) => {
    try {
        const pool = await getPool();
        const [categories] = await pool.execute('SELECT * FROM categories ORDER BY name ASC');
        res.json(categories);
    } catch (err) {
        console.error('Fetch categories error:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get Products (with Search, Filter, Sort)
app.get('/api/products', async (req, res) => {
    try {
        const { category, search, sort } = req.query;
        const pool = await getPool();

        let query = `
            SELECT p.*, c.name as category_name, c.slug as category_slug 
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;
        const queryParams = [];

        if (category && category !== 'all') {
            if (!isNaN(category)) {
                query += ' AND p.category_id = ?';
                queryParams.push(parseInt(category));
            } else {
                query += ' AND c.slug = ?';
                queryParams.push(category);
            }
        }

        if (search && search.trim() !== '') {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            const searchTerm = `%${search.trim()}%`;
            queryParams.push(searchTerm, searchTerm);
        }

        if (sort === 'price_asc') {
            query += ' ORDER BY p.price ASC';
        } else if (sort === 'price_desc') {
            query += ' ORDER BY p.price DESC';
        } else if (sort === 'rating_desc') {
            query += ' ORDER BY p.rating DESC';
        } else {
            query += ' ORDER BY p.created_at DESC';
        }

        const [products] = await pool.execute(query, queryParams);
        res.json(products);
    } catch (err) {
        console.error('Fetch products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get Single Product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();

        const [products] = await pool.execute(`
            SELECT p.*, c.name as category_name, c.slug as category_slug 
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [id]);

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(products[0]);
    } catch (err) {
        console.error('Fetch product error:', err);
        res.status(500).json({ error: 'Failed to fetch product details' });
    }
});

// Middleware for Admin Auth
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin privileges required' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Add New Product (Admin only)
app.post('/api/products', authenticateAdmin, async (req, res) => {
    try {
        const { category_id, name, description, price, stock, image_url } = req.body;
        if (!category_id || !name || !description || price === undefined || !image_url) {
            return res.status(400).json({ error: 'Missing required product fields' });
        }

        const pool = await getPool();
        const [result] = await pool.execute(`
            INSERT INTO products (category_id, name, description, price, stock, image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [category_id, name, description, price, stock || 10, image_url]);

        res.status(201).json({
            message: 'Product created successfully',
            productId: result.insertId
        });
    } catch (err) {
        console.error('Create product error:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.listen(PORT, () => {
    console.log(`[Product Service] Running on port ${PORT}`);
});
