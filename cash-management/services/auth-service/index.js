const { createApp, SimpleDb, successResponse, errorResponse, generateToken, verifyToken, hashPassword, verifyPassword, logAudit } = require('../shared/utils');

const app = createApp();
const PORT = process.env.PORT || 5001;

// Seed Accounts & Default Users
const db = new SimpleDb('auth-service', {
  users: [
    {
      id: 'USR-001',
      name: 'Sarah Connor',
      email: 'admin@corporate.com',
      passwordHash: hashPassword('admin123'),
      role: 'Admin',
      department: 'Corporate Treasury',
      createdAt: new Date().toISOString()
    },
    {
      id: 'USR-002',
      name: 'Michael Scott',
      email: 'manager@corporate.com',
      passwordHash: hashPassword('manager123'),
      role: 'Treasury_Manager',
      department: 'Cash Operations',
      createdAt: new Date().toISOString()
    },
    {
      id: 'USR-003',
      name: 'Angela Martin',
      email: 'accountant@corporate.com',
      passwordHash: hashPassword('account123'),
      role: 'Accountant',
      department: 'Accounts Payable & Receivable',
      createdAt: new Date().toISOString()
    }
  ]
});

// Auth Guard Function
function authGuard(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authorization token required', 401);
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
  req.user = decoded;
  next();
}

// Health Check
app.get('/health', (req, res) => {
  return res.server ? res.end(JSON.stringify({ service: 'auth-service', status: 'UP', port: PORT })) : successResponse(res, { service: 'auth-service', status: 'UP', port: PORT });
});

// User Registration
app.post('/register', (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password) {
    return errorResponse(res, 'Name, email, and password are required', 400);
  }

  const users = db.get('users');
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return errorResponse(res, 'User with this email already exists', 400);
  }

  const newUser = {
    id: 'USR-' + String(users.length + 1).padStart(3, '0'),
    name,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    role: role || 'Accountant',
    department: department || 'Treasury',
    createdAt: new Date().toISOString()
  };

  db.insert('users', newUser);
  logAudit('auth-service', 'USER_REGISTERED', newUser.email, { userId: newUser.id, role: newUser.role });

  const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name });

  const { passwordHash, ...userWithoutPassword } = newUser;
  return successResponse(res, { user: userWithoutPassword, token }, 'User registered successfully', 201);
});

// User Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return errorResponse(res, 'Email and password are required', 400);
  }

  const users = db.get('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return errorResponse(res, 'Invalid email or password', 401);
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    department: user.department
  });

  logAudit('auth-service', 'USER_LOGIN', user.email, { userId: user.id, role: user.role });

  const { passwordHash, ...userWithoutPassword } = user;
  return successResponse(res, { user: userWithoutPassword, token }, 'Login successful');
});

// Profile / Current User
app.get('/me', (req, res) => {
  authGuard(req, res, () => {
    const users = db.get('users');
    const user = users.find(u => u.id === req.user.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    const { passwordHash, ...userWithoutPassword } = user;
    return successResponse(res, userWithoutPassword, 'User profile retrieved');
  });
});

// All Users
app.get('/users', (req, res) => {
  authGuard(req, res, () => {
    const users = db.get('users');
    const safeUsers = users.map(({ passwordHash, ...u }) => u);
    return successResponse(res, safeUsers, 'Users list retrieved');
  });
});

app.listen(PORT, () => {
  console.log(`[Auth Service] Running on http://localhost:${PORT}`);
});
