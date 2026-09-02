const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const PUBLIC_DIR = path.join(__dirname, '../../public');

const SERVICES = {
  auth: { name: 'Auth & Identity Service', port: process.env.AUTH_PORT || 5001, url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001' },
  accounts: { name: 'Account & Liquidity Service', port: process.env.ACCOUNT_PORT || 5002, url: process.env.ACCOUNT_SERVICE_URL || 'http://localhost:5002' },
  transactions: { name: 'Transaction Engine Service', port: process.env.TRANSACTION_PORT || 5003, url: process.env.TRANSACTION_SERVICE_URL || 'http://localhost:5003' },
  analytics: { name: 'Analytics & Forecasting Service', port: process.env.ANALYTICS_PORT || 5004, url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5004' },
  reconciliation: { name: 'Reconciliation & Audit Service', port: process.env.RECONCILIATION_PORT || 5005, url: process.env.RECONCILIATION_SERVICE_URL || 'http://localhost:5005' }
};

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function proxyRequest(targetUrl, req, res) {
  const parsedTarget = new URL(targetUrl);
  const options = {
    hostname: parsedTarget.hostname,
    port: parsedTarget.port,
    path: parsedTarget.pathname + parsedTarget.search,
    method: req.method,
    headers: { ...req.headers, host: parsedTarget.host }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[Gateway Proxy Error -> ${targetUrl}]:`, err.message);
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: `Microservice at ${targetUrl} is currently unreachable`,
      error: err.message,
      timestamp: new Date().toISOString()
    }));
  });

  req.pipe(proxyReq);
}

function serveStatic(req, res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        const fallbackPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(fallbackPath, (fallbackErr, fallbackContent) => {
          if (fallbackErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(fallbackContent);
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    });
    return res.end();
  }

  // Gateway Aggregated System Health Endpoint
  if (pathname === '/health') {
    const serviceKeys = Object.keys(SERVICES);
    const pingPromises = serviceKeys.map(key => {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const service = SERVICES[key];
        const pingReq = http.get(`${service.url}/health`, { timeout: 2000 }, (pingRes) => {
          let rawData = '';
          pingRes.on('data', chunk => rawData += chunk);
          pingRes.on('end', () => {
            resolve({
              key,
              name: service.name,
              port: service.port,
              status: pingRes.statusCode === 200 ? 'UP' : 'DEGRADED',
              latencyMs: Date.now() - startTime
            });
          });
        });

        pingReq.on('error', () => {
          resolve({ key, name: service.name, port: service.port, status: 'DOWN', latencyMs: Date.now() - startTime });
        });

        pingReq.on('timeout', () => {
          pingReq.destroy();
          resolve({ key, name: service.name, port: service.port, status: 'TIMEOUT', latencyMs: 2000 });
        });
      });
    });

    Promise.all(pingPromises).then(statuses => {
      const healthResults = {};
      statuses.forEach(s => healthResults[s.key] = s);
      const overallStatus = statuses.every(s => s.status === 'UP') ? 'HEALTHY' : 'PARTIAL_OUTAGE';

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({
        gateway: 'UP',
        port: PORT,
        systemStatus: overallStatus,
        microservices: healthResults,
        timestamp: new Date().toISOString()
      }));
    });
    return;
  }

  // Microservice Proxy Routing
  if (pathname.startsWith('/api/v1/auth')) {
    const subPath = req.url.replace('/api/v1/auth', '');
    return proxyRequest(`${SERVICES.auth.url}${subPath || '/'}`, req, res);
  }
  if (pathname.startsWith('/api/v1/accounts')) {
    const subPath = req.url.replace('/api/v1/accounts', '');
    return proxyRequest(`${SERVICES.accounts.url}${subPath || '/'}`, req, res);
  }
  if (pathname.startsWith('/api/v1/transactions')) {
    const subPath = req.url.replace('/api/v1/transactions', '');
    return proxyRequest(`${SERVICES.transactions.url}${subPath || '/'}`, req, res);
  }
  if (pathname.startsWith('/api/v1/analytics')) {
    const subPath = req.url.replace('/api/v1/analytics', '');
    return proxyRequest(`${SERVICES.analytics.url}${subPath || '/'}`, req, res);
  }
  if (pathname.startsWith('/api/v1/reconciliation')) {
    const subPath = req.url.replace('/api/v1/reconciliation', '');
    return proxyRequest(`${SERVICES.reconciliation.url}${subPath || '/'}`, req, res);
  }

  // Static File Serving
  let relativeFilePath = pathname === '/' ? 'index.html' : pathname;
  const safeFilePath = path.join(PUBLIC_DIR, path.normalize(relativeFilePath).replace(/^(\.\.[\/\\])+/, ''));
  serveStatic(req, res, safeFilePath);
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard UI accessible at http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
