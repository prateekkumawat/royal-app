const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_cms_jwt_key_2026';

/**
 * Native JWT Implementation (HS256)
 */
function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

function generateToken(payload) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + (24 * 3600);
  const body = base64UrlEncode(JSON.stringify({ ...payload, exp }));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64')
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(base64UrlDecode(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Native Password Hash
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_salt_cms_2026').digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

/**
 * Lightweight File-backed JSON Database for Database-Per-Service isolation pattern
 */
class SimpleDb {
  constructor(serviceName, defaultData = {}) {
    this.dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    this.filePath = path.join(this.dataDir, `${serviceName}.json`);
    this.defaultData = defaultData;
    this.init();
  }

  init() {
    if (!fs.existsSync(this.filePath)) {
      this.save(this.defaultData);
    }
  }

  read() {
    try {
      if (!fs.existsSync(this.filePath)) return this.defaultData;
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return this.defaultData;
    }
  }

  save(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error(`[DB Write Error - ${this.filePath}]:`, err);
    }
  }

  get(collectionName) {
    const db = this.read();
    return db[collectionName] || [];
  }

  setCollection(collectionName, items) {
    const db = this.read();
    db[collectionName] = items;
    this.save(db);
  }

  insert(collectionName, item) {
    const db = this.read();
    if (!db[collectionName]) db[collectionName] = [];
    db[collectionName].push(item);
    this.save(db);
    return item;
  }

  update(collectionName, queryFn, updateData) {
    const db = this.read();
    const items = db[collectionName] || [];
    let updatedItem = null;
    db[collectionName] = items.map((item) => {
      if (queryFn(item)) {
        updatedItem = { ...item, ...updateData, updatedAt: new Date().toISOString() };
        return updatedItem;
      }
      return item;
    });
    this.save(db);
    return updatedItem;
  }
}

/**
 * Standard Response Helpers
 */
function successResponse(res, data, message = 'Success', statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  });
  return res.end(JSON.stringify({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }));
}

function errorResponse(res, message = 'An error occurred', statusCode = 500, errors = null) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  });
  return res.end(JSON.stringify({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Native Microservice Express-like Router App
 */
function createApp() {
  const routes = [];

  function addRoute(method, pattern, handler) {
    routes.push({ method: method.toUpperCase(), pattern, handler });
  }

  const server = http.createServer((req, res) => {
    // Handle CORS Preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      });
      return res.end();
    }

    let bodyData = '';
    req.on('data', chunk => bodyData += chunk);
    req.on('end', () => {
      req.body = {};
      if (bodyData) {
        try { req.body = JSON.parse(bodyData); } catch (e) {}
      }

      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      req.pathname = parsedUrl.pathname;
      req.query = Object.fromEntries(parsedUrl.searchParams.entries());

      // Match route
      let matchedRoute = null;
      let params = {};

      for (const r of routes) {
        if (r.method !== 'ALL' && r.method !== req.method) continue;

        // Simple param matching e.g. /transactions/:id/approve
        const paramKeys = [];
        const regexPath = r.pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
          paramKeys.push(key);
          return '([^/]+)';
        });
        const match = req.pathname.match(new RegExp(`^${regexPath}$`));

        if (match) {
          matchedRoute = r;
          paramKeys.forEach((key, idx) => {
            params[key] = match[idx + 1];
          });
          break;
        }
      }

      if (matchedRoute) {
        req.params = params;
        return matchedRoute.handler(req, res);
      }

      return errorResponse(res, `Endpoint ${req.method} ${req.pathname} not found`, 404);
    });
  });

  return {
    get: (path, handler) => addRoute('GET', path, handler),
    post: (path, handler) => addRoute('POST', path, handler),
    patch: (path, handler) => addRoute('PATCH', path, handler),
    all: (path, handler) => addRoute('ALL', path, handler),
    listen: (port, cb) => server.listen(port, cb),
    server
  };
}

/**
 * Audit Logging Helper
 */
function logAudit(service, action, actor, details = {}) {
  try {
    const auditDb = new SimpleDb('reconciliation-service', { auditLogs: [], bankStatements: [] });
    auditDb.insert('auditLogs', {
      id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      service,
      action,
      actor: actor || 'System',
      details
    });
  } catch (e) {
    console.error('Failed to log audit event:', e.message);
  }
}

module.exports = {
  SimpleDb,
  successResponse,
  errorResponse,
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  createApp,
  logAudit,
  JWT_SECRET
};
