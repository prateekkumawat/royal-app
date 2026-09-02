/**
 * ApexCash - Enterprise Cash Management System Frontend Application Logic
 */

const API_BASE = '/api/v1';

// Preset Authentication Tokens for Quick Role Switcher
const TOKENS = {
  admin: null,
  manager: null,
  accountant: null
};

let currentRole = 'manager';
let currentToken = '';
let forecastChartInstance = null;
let detailForecastChartInstance = null;
let currencyChartInstance = null;
let breakdownChartInstance = null;

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initNavigation();
  initModals();
  initRoleSwitcher();
  await authenticateAllRoles();
  
  // Initial Data Fetch
  refreshDashboard();
  refreshAccounts();
  refreshTransactions();
  refreshForecasting(30);
  refreshReconciliation();
  refreshAuditLogs();
  checkMicroservicesHealth();

  // Periodic Health Check
  setInterval(checkMicroservicesHealth, 10000);
});

/* ==========================================================================
   AUTHENTICATION & ROLE SWITCHER
   ========================================================================== */

async function authenticateAllRoles() {
  try {
    const roles = [
      { key: 'admin', email: 'admin@corporate.com', password: 'admin123' },
      { key: 'manager', email: 'manager@corporate.com', password: 'manager123' },
      { key: 'accountant', email: 'accountant@corporate.com', password: 'account123' }
    ];

    for (const r of roles) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: r.email, password: r.password })
      });
      const data = await res.json();
      if (data.success) {
        TOKENS[r.key] = data.data.token;
      }
    }
    currentToken = TOKENS[currentRole];
  } catch (err) {
    console.error('Failed to pre-authenticate roles:', err);
    showToast('Failed to connect to API Gateway', 'error');
  }
}

function initRoleSwitcher() {
  const roleSelect = document.getElementById('role-select');
  roleSelect.addEventListener('change', (e) => {
    currentRole = e.target.value;
    currentToken = TOKENS[currentRole];
    showToast(`Switched active role to: ${currentRole.toUpperCase()}`, 'info');
    refreshDashboard();
    refreshTransactions();
  });
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${currentToken}`
  };
}

/* ==========================================================================
   THEME TOGGLE
   ========================================================================== */

function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('apexcash_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  toggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('apexcash_theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#theme-toggle i');
  if (theme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

/* ==========================================================================
   NAVIGATION TABS
   ========================================================================== */

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      navItems.forEach(i => i.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const targetPane = document.getElementById(`tab-${targetTab}`);
      if (targetPane) targetPane.classList.add('active');

      const titleMap = {
        dashboard: 'Liquidity Overview',
        accounts: 'Accounts & Cash Sweeps',
        transactions: 'Transaction Engine & Approvals',
        forecasting: 'Cash Flow Forecasting & Analytics',
        reconciliation: 'Bank Reconciliation',
        audit: 'Audit & Compliance Log',
        apiexplorer: 'API Gateway Sandbox'
      };
      pageTitle.textContent = titleMap[targetTab] || 'Dashboard';
    });
  });

  document.getElementById('view-all-txns').addEventListener('click', () => {
    document.querySelector('[data-tab="transactions"]').click();
  });

  // Forecasting Horizon Toggles
  const horizonBtns = document.querySelectorAll('.horizon-toggle button');
  horizonBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      horizonBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const days = parseInt(btn.getAttribute('data-days'), 10);
      refreshForecasting(days);
    });
  });
}

/* ==========================================================================
   DASHBOARD & LIQUIDITY OVERVIEW
   ========================================================================== */

async function refreshDashboard() {
  try {
    // Fetch Liquidity Summary
    const summaryRes = await fetch(`${API_BASE}/accounts/liquidity-summary`, { headers: getAuthHeaders() });
    const summaryData = await summaryRes.json();
    if (summaryData.success) {
      document.getElementById('kpi-total-cash').textContent = '$' + summaryData.data.totalUsdEquivalent.toLocaleString('en-US', { minimumFractionDigits: 2 });
      renderCurrencyChart(summaryData.data.currencyBreakdown);
    }

    // Fetch KPIs
    const kpiRes = await fetch(`${API_BASE}/analytics/kpis`, { headers: getAuthHeaders() });
    const kpiData = await kpiRes.json();
    if (kpiData.success) {
      document.getElementById('kpi-ccc').textContent = `${kpiData.data.cashConversionCycle} Days`;
      document.getElementById('kpi-runway').textContent = `${kpiData.data.runwayMonths} Months`;
    }

    // Fetch Pending Approvals Count
    const pendingRes = await fetch(`${API_BASE}/transactions/pending-approvals`, { headers: getAuthHeaders() });
    const pendingData = await pendingRes.json();
    if (pendingData.success) {
      const count = pendingData.data.length;
      document.getElementById('kpi-pending-approvals').textContent = count;
      document.getElementById('nav-pending-count').textContent = count;
    }

    // Fetch Forecast Chart
    const forecastRes = await fetch(`${API_BASE}/analytics/forecast?days=30`, { headers: getAuthHeaders() });
    const forecastData = await forecastRes.json();
    if (forecastData.success) {
      renderDashboardForecastChart(forecastData.data.dataPoints);
    }

    // Fetch Recent Transactions
    const txnsRes = await fetch(`${API_BASE}/transactions`, { headers: getAuthHeaders() });
    const txnsData = await txnsRes.json();
    if (txnsData.success) {
      renderRecentTransactionsTable(txnsData.data.slice(0, 5));
    }
  } catch (err) {
    console.error('Error refreshing dashboard:', err);
  }
}

function renderRecentTransactionsTable(transactions) {
  const tbody = document.getElementById('recent-transactions-tbody');
  tbody.innerHTML = '';

  transactions.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.referenceNo}</strong></td>
      <td>${t.type}</td>
      <td><strong>$${t.amount.toLocaleString()}</strong></td>
      <td><span class="badge badge-info">${t.currency}</span></td>
      <td><span class="badge ${getStatusBadgeClass(t.status)}">${t.status}</span></td>
      <td>${t.initiatedBy}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ==========================================================================
   ACCOUNTS & CASH SWEEPS
   ========================================================================== */

async function refreshAccounts() {
  try {
    const res = await fetch(`${API_BASE}/accounts/accounts`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!data.success) return;

    const container = document.getElementById('accounts-cards-container');
    container.innerHTML = '';

    data.data.forEach(acc => {
      const card = document.createElement('div');
      card.className = 'acc-card glass';
      card.innerHTML = `
        <div class="acc-card-top">
          <div class="acc-title">
            <h4>${acc.accountName}</h4>
            <span class="acc-bank">${acc.bankName} (${acc.accountNumber})</span>
          </div>
          <span class="badge ${acc.isConcentrationAccount ? 'badge-warning' : 'badge-info'}">
            ${acc.isConcentrationAccount ? 'Concentration Account' : acc.accountType}
          </span>
        </div>
        <div class="acc-balance">
          ${getCurrencySymbol(acc.currency)}${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div class="acc-meta">
          <span>Target Balance: $${(acc.targetBalance || 0).toLocaleString()}</span>
          <span>Status: <strong style="color: var(--accent-emerald)">${acc.status}</strong></span>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading accounts:', err);
  }
}

// Trigger Automated Cash Sweep Action
document.getElementById('btn-run-sweep').addEventListener('click', executeCashSweep);
document.getElementById('btn-quick-sweep').addEventListener('click', executeCashSweep);

async function executeCashSweep() {
  try {
    const res = await fetch(`${API_BASE}/accounts/accounts/sweep`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      refreshAccounts();
      refreshDashboard();
      refreshAuditLogs();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to execute cash sweep', 'error');
  }
}

/* ==========================================================================
   TRANSACTIONS & DUAL-CONTROL APPROVAL WORKFLOW
   ========================================================================== */

async function refreshTransactions() {
  try {
    const statusFilter = document.getElementById('filter-txn-status').value;
    let url = `${API_BASE}/transactions/transactions`;
    if (statusFilter) url += `?status=${statusFilter}`;

    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!data.success) return;

    const tbody = document.getElementById('all-transactions-tbody');
    tbody.innerHTML = '';

    data.data.forEach(t => {
      const isPending = t.status === 'PENDING_APPROVAL';
      const canApprove = isPending && (currentRole === 'admin' || currentRole === 'manager');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${t.referenceNo}</strong><br><small style="color: var(--text-muted)">${t.id}</small></td>
        <td>${new Date(t.createdAt).toLocaleDateString()}</td>
        <td><strong>${t.type}</strong><br><small>${t.category}</small></td>
        <td>${t.sourceAccountId} → ${t.destinationAccountId}</td>
        <td><strong>$${t.amount.toLocaleString()}</strong></td>
        <td><span class="badge ${getStatusBadgeClass(t.status)}">${t.status}</span></td>
        <td>
          <small>Initiated: ${t.initiatedBy}</small><br>
          <small>Approved: ${t.approvedBy || 'N/A'}</small>
        </td>
        <td>
          ${canApprove ? `
            <button class="btn btn-secondary" onclick="approveTxn('${t.id}')" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;"><i class="fa-solid fa-check"></i> Approve</button>
            <button class="btn btn-outline" onclick="rejectTxn('${t.id}')" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: var(--accent-rose)"><i class="fa-solid fa-xmark"></i> Reject</button>
          ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">-</span>'}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error refreshing transactions:', err);
  }
}

document.getElementById('filter-txn-status').addEventListener('change', refreshTransactions);

async function approveTxn(txnId) {
  try {
    const res = await fetch(`${API_BASE}/transactions/transactions/${txnId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      refreshTransactions();
      refreshDashboard();
      refreshAuditLogs();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Approval request failed', 'error');
  }
}

async function rejectTxn(txnId) {
  try {
    const res = await fetch(`${API_BASE}/transactions/transactions/${txnId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason: 'Rejected by Treasury Manager via UI' })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'info');
      refreshTransactions();
      refreshDashboard();
      refreshAuditLogs();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Rejection failed', 'error');
  }
}

/* ==========================================================================
   FORECASTING & ANALYTICS
   ========================================================================== */

async function refreshForecasting(days = 30) {
  try {
    const forecastRes = await fetch(`${API_BASE}/analytics/forecast?days=${days}`, { headers: getAuthHeaders() });
    const forecastData = await forecastRes.json();
    if (forecastData.success) {
      renderDetailForecastChart(forecastData.data.dataPoints);
    }

    const breakdownRes = await fetch(`${API_BASE}/analytics/cash-flow-breakdown`, { headers: getAuthHeaders() });
    const breakdownData = await breakdownRes.json();
    if (breakdownData.success) {
      renderCashflowBreakdownChart(breakdownData.data);
    }

    const varianceRes = await fetch(`${API_BASE}/analytics/variance-analysis`, { headers: getAuthHeaders() });
    const varianceData = await varianceRes.json();
    if (varianceData.success) {
      renderVarianceTable(varianceData.data.weeklyVariance);
    }
  } catch (err) {
    console.error('Error refreshing forecasting:', err);
  }
}

function renderVarianceTable(varianceList) {
  const tbody = document.getElementById('variance-tbody');
  tbody.innerHTML = '';
  varianceList.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${v.period}</strong></td>
      <td>$${v.forecastedInflow.toLocaleString()}</td>
      <td>$${v.actualInflow.toLocaleString()}</td>
      <td style="color: ${v.varianceInflow >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}">
        ${v.varianceInflow >= 0 ? '+' : ''}$${v.varianceInflow.toLocaleString()} (${v.varianceInflowPct}%)
      </td>
      <td>$${v.forecastedOutflow.toLocaleString()}</td>
      <td>$${v.actualOutflow.toLocaleString()}</td>
      <td><span class="badge ${v.status === 'Favorable' ? 'badge-success' : 'badge-info'}">${v.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ==========================================================================
   BANK RECONCILIATION
   ========================================================================== */

async function refreshReconciliation() {
  try {
    const res = await fetch(`${API_BASE}/reconciliation/reconcile/status`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!data.success) return;

    document.getElementById('reconcile-rate-pct').textContent = `${data.data.reconciliationRatePct}%`;
    document.getElementById('reconciled-count').textContent = data.data.reconciledCount;
    document.getElementById('unreconciled-count').textContent = data.data.unreconciledCount;

    const tbody = document.getElementById('reconciliation-tbody');
    tbody.innerHTML = '';

    data.data.statements.forEach(s => {
      const isUnreconciled = s.status === 'UNRECONCILED';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${s.bankRef}</strong></td>
        <td>${s.date}</td>
        <td>${s.description}</td>
        <td><strong>$${s.amount.toLocaleString()}</strong></td>
        <td>${s.matchedTxnId ? `<code>${s.matchedTxnId}</code>` : '-'}</td>
        <td><span class="badge ${s.matchConfidence === 100 ? 'badge-success' : 'badge-warning'}">${s.matchConfidence}%</span></td>
        <td><span class="badge ${s.status === 'RECONCILED' ? 'badge-success' : 'badge-danger'}">${s.status}</span></td>
        <td>
          ${isUnreconciled ? `
            <button class="btn btn-secondary" onclick="manualMatch('${s.id}')" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;"><i class="fa-solid fa-link"></i> Match TXN-9003</button>
          ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Matched</span>'}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error refreshing reconciliation:', err);
  }
}

async function manualMatch(stmtId) {
  try {
    const res = await fetch(`${API_BASE}/reconciliation/reconcile/match`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ statementId: stmtId, transactionId: 'TXN-9003' })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      refreshReconciliation();
      refreshAuditLogs();
    }
  } catch (err) {
    showToast('Match request failed', 'error');
  }
}

/* ==========================================================================
   AUDIT LOGS
   ========================================================================== */

async function refreshAuditLogs() {
  try {
    const res = await fetch(`${API_BASE}/reconciliation/audit-logs`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!data.success) return;

    const tbody = document.getElementById('audit-logs-tbody');
    tbody.innerHTML = '';

    data.data.forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><small>${new Date(log.timestamp).toLocaleString()}</small></td>
        <td><span class="badge badge-info">${log.service}</span></td>
        <td><strong>${log.action}</strong></td>
        <td>${log.actor}</td>
        <td><code>${JSON.stringify(log.details)}</code></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error refreshing audit logs:', err);
  }
}

/* ==========================================================================
   API GATEWAY EXPLORER & HEALTH
   ========================================================================== */

async function checkMicroservicesHealth() {
  try {
    const res = await fetch('/health');
    const data = await res.json();

    const dot = document.getElementById('system-status-dot');
    const text = document.getElementById('system-status-text');

    if (data.systemStatus === 'HEALTHY') {
      dot.className = 'status-dot healthy';
      text.textContent = 'All 5 Microservices UP';
    } else {
      dot.className = 'status-dot degraded';
      text.textContent = 'Partial Service Degradation';
    }

    // Render Microservice Grid Cards on API Explorer tab
    const msGrid = document.getElementById('microservice-status-cards');
    if (msGrid && data.microservices) {
      msGrid.innerHTML = '';
      Object.keys(data.microservices).forEach(key => {
        const ms = data.microservices[key];
        const card = document.createElement('div');
        card.className = 'ms-card glass';
        card.innerHTML = `
          <div class="ms-header">
            <span class="ms-name">${ms.name}</span>
            <span class="badge ${ms.status === 'UP' ? 'badge-success' : 'badge-danger'}">${ms.status}</span>
          </div>
          <div class="ms-port">Port: ${ms.port} | Latency: ${ms.latencyMs}ms</div>
        `;
        msGrid.appendChild(card);
      });
    }
  } catch (err) {
    console.error('Health check ping failed:', err);
  }
}

// API Explorer Request Runner
document.getElementById('btn-send-api-test').addEventListener('click', async () => {
  const method = document.getElementById('api-method').value;
  const endpoint = document.getElementById('api-endpoint').value;
  const output = document.getElementById('api-response-output');
  const bodyText = document.getElementById('api-body').value;

  output.textContent = 'Sending request to API Gateway...';

  try {
    const options = {
      method,
      headers: getAuthHeaders()
    };
    if (method === 'POST' && bodyText) {
      options.body = bodyText;
    }

    const res = await fetch(endpoint, options);
    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    output.textContent = `API Request Error: ${err.message}`;
  }
});

/* ==========================================================================
   CHARTS (CHART.JS)
   ========================================================================== */

function renderDashboardForecastChart(dataPoints) {
  const ctx = document.getElementById('forecastChart').getContext('2d');
  if (forecastChartInstance) forecastChartInstance.destroy();

  forecastChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataPoints.map(d => d.date),
      datasets: [
        {
          label: 'Projected Cash Balance ($)',
          data: dataPoints.map(d => d.endingBalanceUSD),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
      }
    }
  });
}

function renderDetailForecastChart(dataPoints) {
  const ctx = document.getElementById('detailForecastChart').getContext('2d');
  if (detailForecastChartInstance) detailForecastChartInstance.destroy();

  detailForecastChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dataPoints.map(d => d.date),
      datasets: [
        { label: 'Inflows ($)', data: dataPoints.map(d => d.projectedInflow), backgroundColor: '#10b981' },
        { label: 'Outflows ($)', data: dataPoints.map(d => d.projectedOutflow), backgroundColor: '#ef4444' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
      }
    }
  });
}

function renderCurrencyChart(currencyBreakdown) {
  const ctx = document.getElementById('currencyChart').getContext('2d');
  if (currencyChartInstance) currencyChartInstance.destroy();

  const labels = Object.keys(currencyBreakdown);
  const values = labels.map(k => currencyBreakdown[k].usdEquivalent);

  currencyChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af' } } }
    }
  });
}

function renderCashflowBreakdownChart(breakdownData) {
  const ctx = document.getElementById('cashflowBreakdownChart').getContext('2d');
  if (breakdownChartInstance) breakdownChartInstance.destroy();

  const labels = breakdownData.inflows.map(i => i.category);
  const values = breakdownData.inflows.map(i => i.amountUSD);

  breakdownChartInstance = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(99,102,241,0.7)', 'rgba(245,158,11,0.7)', 'rgba(6,182,212,0.7)'] }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af' } } }
    }
  });
}

/* ==========================================================================
   MODALS & TOAST NOTIFICATIONS
   ========================================================================== */

function initModals() {
  const txnModal = document.getElementById('txn-modal');
  const accountModal = document.getElementById('account-modal');

  document.getElementById('btn-quick-new-txn').addEventListener('click', () => txnModal.classList.add('active'));
  document.getElementById('btn-new-transaction').addEventListener('click', () => txnModal.classList.add('active'));
  document.getElementById('close-txn-modal').addEventListener('click', () => txnModal.classList.remove('active'));
  document.getElementById('cancel-txn-modal').addEventListener('click', () => txnModal.classList.remove('active'));

  document.getElementById('btn-add-account').addEventListener('click', () => accountModal.classList.add('active'));
  document.getElementById('close-account-modal').addEventListener('click', () => accountModal.classList.remove('active'));
  document.getElementById('cancel-account-modal').addEventListener('click', () => accountModal.classList.remove('active'));

  // Transaction Form Submit
  document.getElementById('txn-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      type: document.getElementById('form-txn-type').value,
      category: document.getElementById('form-txn-category').value,
      amount: parseFloat(document.getElementById('form-txn-amount').value),
      currency: document.getElementById('form-txn-currency').value,
      description: document.getElementById('form-txn-desc').value,
      sourceAccountId: 'ACC-101',
      destinationAccountId: 'ACC-102'
    };

    try {
      const res = await fetch(`${API_BASE}/transactions/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        txnModal.classList.remove('active');
        refreshDashboard();
        refreshTransactions();
        refreshAuditLogs();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Failed to submit transaction', 'error');
    }
  });

  // Create Account Form Submit
  document.getElementById('account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      accountName: document.getElementById('form-acc-name').value,
      bankName: document.getElementById('form-acc-bank').value,
      accountType: document.getElementById('form-acc-type').value,
      currency: document.getElementById('form-acc-curr').value,
      balance: parseFloat(document.getElementById('form-acc-balance').value),
      targetBalance: parseFloat(document.getElementById('form-acc-target').value)
    };

    try {
      const res = await fetch(`${API_BASE}/accounts/accounts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        accountModal.classList.remove('active');
        refreshAccounts();
        refreshDashboard();
      }
    } catch (err) {
      showToast('Failed to create account', 'error');
    }
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid fa-info-circle"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'COMPLETED': case 'RECONCILED': case 'Active': return 'badge-success';
    case 'PENDING_APPROVAL': case 'UNRECONCILED': return 'badge-warning';
    case 'REJECTED': return 'badge-danger';
    default: return 'badge-info';
  }
}

function getCurrencySymbol(curr) {
  switch (curr) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'INR': return '₹';
    default: return '$';
  }
}
