const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'Gateway Service', script: 'services/gateway-service/index.js', port: 5000 },
  { name: 'Auth Service', script: 'services/auth-service/index.js', port: 5001 },
  { name: 'Account Service', script: 'services/account-service/index.js', port: 5002 },
  { name: 'Transaction Service', script: 'services/transaction-service/index.js', port: 5003 },
  { name: 'Analytics Service', script: 'services/analytics-service/index.js', port: 5004 },
  { name: 'Reconciliation Service', script: 'services/reconciliation-service/index.js', port: 5005 }
];

console.log('=======================================================');
console.log('🚀 ApexCash Microservices Orchestrator starting up...');
console.log('=======================================================');

const processes = [];

services.forEach((svc) => {
  const child = spawn('node', [path.join(__dirname, svc.script)], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${svc.name}] ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[${svc.name} ERROR] ${data}`);
  });

  child.on('close', (code) => {
    console.log(`[${svc.name}] Process exited with code ${code}`);
  });

  processes.push(child);
});

// Handle graceful termination
process.on('SIGINT', () => {
  console.log('\nStopping all microservices...');
  processes.forEach(p => p.kill());
  process.exit(0);
});
