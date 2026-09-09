const express = require('express');
const cors = require('cors');
const http = require('http');
const os = require('os');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cache AWS EC2 IMDSv2 metadata
let awsMetadataCache = {
  instanceId: process.env.INSTANCE_ID || null,
  privateIp: process.env.PRIVATE_IP || null,
  availabilityZone: process.env.AVAILABILITY_ZONE || null,
  publicIp: process.env.PUBLIC_IP || null,
  region: process.env.AWS_REGION || null,
  lastUpdated: 0
};

// Helper: Make HTTP GET with timeout
function httpGetAsync(url, headers = {}, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.pathname,
        method: 'GET',
        headers: headers,
        timeout: timeoutMs
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(res.statusCode === 200 ? data.trim() : null));
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

// Helper: Make HTTP PUT for IMDSv2 Token
function getImdsToken(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: '169.254.169.254',
        port: 80,
        path: '/latest/api/token',
        method: 'PUT',
        headers: {
          'X-aws-ec2-metadata-token-ttl-seconds': '21600'
        },
        timeout: timeoutMs
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(res.statusCode === 200 ? data.trim() : null));
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

// Fetch AWS Metadata from IMDSv2
async function fetchAwsMetadata() {
  const now = Date.now();
  // Refresh cache every 60 seconds
  if (awsMetadataCache.instanceId && now - awsMetadataCache.lastUpdated < 60000) {
    return awsMetadataCache;
  }

  try {
    const token = await getImdsToken();
    if (token) {
      const headers = { 'X-aws-ec2-metadata-token': token };
      const instanceId = await httpGetAsync('http://169.254.169.254/latest/meta-data/instance-id', headers);
      const privateIp = await httpGetAsync('http://169.254.169.254/latest/meta-data/local-ipv4', headers);
      const az = await httpGetAsync('http://169.254.169.254/latest/meta-data/placement/availability-zone', headers);
      const publicIp = await httpGetAsync('http://169.254.169.254/latest/meta-data/public-ipv4', headers);

      if (instanceId) {
        awsMetadataCache.instanceId = instanceId;
        awsMetadataCache.privateIp = privateIp || getLocalIpAddress();
        awsMetadataCache.availabilityZone = az || 'unknown-az';
        awsMetadataCache.publicIp = publicIp || 'N/A (Private Subnet)';
        awsMetadataCache.region = az ? az.slice(0, -1) : 'unknown-region';
        awsMetadataCache.lastUpdated = now;
        return awsMetadataCache;
      }
    }
  } catch (err) {
    // Non-AWS environment
  }

  // Fallback to local network interfaces
  awsMetadataCache.instanceId = process.env.INSTANCE_ID || `local-node-${os.hostname()}`;
  awsMetadataCache.privateIp = getLocalIpAddress();
  awsMetadataCache.availabilityZone = process.env.AVAILABILITY_ZONE || 'local-dev-az1';
  awsMetadataCache.publicIp = '127.0.0.1';
  awsMetadataCache.region = process.env.AWS_REGION || 'local-region';
  awsMetadataCache.lastUpdated = now;

  return awsMetadataCache;
}

// Fallback helper to extract primary IPv4 address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

// Parse client IP considering ALB X-Forwarded-For header
function getClientIp(req) {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // X-Forwarded-For can contain comma separated chain: "client, proxy1, proxy2"
    const ips = xForwardedFor.split(',').map((ip) => ip.trim());
    return {
      clientIp: ips[0],
      proxyChain: ips,
      rawHeader: xForwardedFor
    };
  }
  return {
    clientIp: req.socket.remoteAddress || req.ip || '127.0.0.1',
    proxyChain: [req.socket.remoteAddress || '127.0.0.1'],
    rawHeader: null
  };
}

// Global server request counter
let totalRequestsHandled = 0;

// API: Main metadata endpoint
app.get('/api/info', async (req, res) => {
  totalRequestsHandled++;
  const awsData = await fetchAwsMetadata();
  const clientData = getClientIp(req);

  res.json({
    timestamp: new Date().toISOString(),
    requestsHandled: totalRequestsHandled,
    server: {
      hostname: os.hostname(),
      instanceId: awsData.instanceId,
      privateIp: awsData.privateIp,
      publicIp: awsData.publicIp,
      availabilityZone: awsData.availabilityZone,
      region: awsData.region,
      platform: os.platform(),
      uptimeSeconds: Math.floor(os.uptime())
    },
    client: {
      ip: clientData.clientIp,
      proxyChain: clientData.proxyChain,
      rawForwardedFor: clientData.rawHeader,
      protocol: req.headers['x-forwarded-proto'] || req.protocol,
      port: req.headers['x-forwarded-port'] || req.socket.localPort,
      userAgent: req.headers['user-agent']
    },
    albHeaders: {
      host: req.headers['host'],
      xForwardedFor: req.headers['x-forwarded-for'] || null,
      xForwardedProto: req.headers['x-forwarded-proto'] || null,
      xForwardedPort: req.headers['x-forwarded-port'] || null,
      xAmznTraceId: req.headers['x-amzn-trace-id'] || null
    },
    rawHeaders: req.headers
  });
});

// ALB Health Check Endpoint
app.get('/health', async (req, res) => {
  const awsData = await fetchAwsMetadata();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    instanceId: awsData.instanceId,
    privateIp: awsData.privateIp
  });
});

// CPU Stress Endpoint to simulate CPU load for ASG Auto Scaling
app.post('/api/stress', (req, res) => {
  const durationMs = parseInt(req.body.durationMs) || 3000;
  const startTime = Date.now();

  // Run heavy loop for requested duration
  while (Date.now() - startTime < durationMs) {
    Math.sqrt(Math.random() * Math.random());
  }

  res.json({
    message: `CPU stress completed for ${durationMs}ms`,
    instanceId: awsMetadataCache.instanceId || os.hostname()
  });
});

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 AWS Load Balancer Web App listening on port ${PORT}`);
  console.log(`- Health Check: http://localhost:${PORT}/health`);
  console.log(`- Info API:     http://localhost:${PORT}/api/info`);
  console.log(`====================================================`);
});
