const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026';

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'auth-service', status: 'UP', timestamp: new Date() });
});

// Helper to generate JWT
function generateToken(user) {
    return jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// User Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const pool = await getPool();
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name.trim(), email.toLowerCase().trim(), hashedPassword, 'customer']
        );

        const newUser = {
            id: result.insertId,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            role: 'customer'
        };

        const token = generateToken(newUser);
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: newUser
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const pool = await getPool();
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const token = generateToken(userData);
        res.json({
            message: 'Login successful',
            token,
            user: userData
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Current User Profile
app.get('/api/auth/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header missing or invalid' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const pool = await getPool();
        const [users] = await pool.execute('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [decoded.id]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: users[0] });
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

app.listen(PORT, () => {
    console.log(`[Auth Service] Running on port ${PORT}`);
});
