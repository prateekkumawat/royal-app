const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', err => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=======================================================');
  console.log('🧪 Running ApexCash Microservices Integration Tests');
  console.log('=======================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passed++;
    } else {
      console.log(` ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Gateway Health Check
    console.log('\n--- 1. API Gateway & Microservices Health ---');
    const health = await makeRequest({ hostname: 'localhost', port: 5000, path: '/health', method: 'GET' });
    assert(health.statusCode === 200, 'Gateway /health returns 200 OK');
    assert(health.body.systemStatus === 'HEALTHY', 'All 5 microservices reported HEALTHY');

    // 2. Auth Service Test
    console.log('\n--- 2. Auth Service (Port 5001 via Gateway) ---');
    const loginRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'manager@corporate.com', password: 'manager123' }
    );
    assert(loginRes.statusCode === 200 && loginRes.body.success, 'Treasury Manager login successful');
    const token = loginRes.body.data.token;
    assert(Boolean(token), 'JWT Token issued');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 3. Account & Liquidity Service
    console.log('\n--- 3. Account & Liquidity Service (Port 5002 via Gateway) ---');
    const accountsRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/v1/accounts/accounts', method: 'GET', headers: authHeaders });
    assert(accountsRes.statusCode === 200 && accountsRes.body.data.length >= 5, 'Fetched multi-currency accounts');

    const liquidityRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/v1/accounts/liquidity-summary', method: 'GET', headers: authHeaders });
    assert(liquidityRes.statusCode === 200 && liquidityRes.body.data.totalUsdEquivalent > 0, 'Calculated total USD equivalent liquidity position');

    // 4. Transaction Engine Service
    console.log('\n--- 4. Transaction Engine Service (Port 5003 via Gateway) ---');
    const newTxnRes = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/v1/transactions/transactions', method: 'POST', headers: authHeaders },
      {
        type: 'INTERNAL_TRANSFER',
        category: 'Test Rebalance',
        sourceAccountId: 'ACC-101',
        destinationAccountId: 'ACC-102',
        amount: 25000,
        currency: 'USD',
        description: 'Automated test high-value transfer'
      }
    );
    assert(newTxnRes.statusCode === 201 && newTxnRes.body.data.status === 'PENDING_APPROVAL', 'High-value transfer (≥ $10k) correctly routed to Pending Approval');

    const pendingTxnId = newTxnRes.body.data.id;

    // Admin approval test
    const adminLogin = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/v1/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'admin@corporate.com', password: 'admin123' }
    );
    const adminToken = adminLogin.body.data.token;

    const approveRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/transactions/transactions/${pendingTxnId}/approve`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    });
    assert(approveRes.statusCode === 200 && approveRes.body.data.status === 'COMPLETED', 'Dual-Control approval executed successfully');

    // 5. Analytics & Forecasting Service
    console.log('\n--- 5. Analytics & Forecasting Service (Port 5004 via Gateway) ---');
    const forecastRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/v1/analytics/forecast?days=30', method: 'GET', headers: authHeaders });
    assert(forecastRes.statusCode === 200 && forecastRes.body.data.dataPoints.length > 0, 'Generated 30-day cash flow predictive forecast');

    const kpiRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/v1/analytics/kpis', method: 'GET', headers: authHeaders });
    assert(kpiRes.statusCode === 200 && Boolean(kpiRes.body.data.cashConversionCycle), 'Calculated Working Capital Cash Conversion Cycle (CCC)');

    // 6. Reconciliation & Audit Service
    console.log('\n--- 6. Reconciliation & Audit Service (Port 5005 via Gateway) ---');
    const reconcileStatus = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/v1/reconciliation/reconcile/status', method: 'GET', headers: authHeaders });
    assert(reconcileStatus.statusCode === 200 && Array.isArray(reconcileStatus.body.data.statements), 'Fetched bank statement reconciliation status');

    const auditRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/v1/reconciliation/audit-logs', method: 'GET', headers: authHeaders });
    assert(auditRes.statusCode === 200 && auditRes.body.data.length > 0, 'Retrieved immutable audit log history');

    console.log('=======================================================');
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('=======================================================');
    process.exit(failed > 0 ? 1 : 0);

  } catch (err) {
    console.error('Integration test execution failed:', err);
    process.exit(1);
  }
}

runTests();
