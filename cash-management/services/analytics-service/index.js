const { createApp, SimpleDb, successResponse, errorResponse, verifyToken } = require('../shared/utils');

const app = createApp();
const PORT = process.env.PORT || 5004;

function authGuard(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authorization token required', 401);
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return errorResponse(res, 'Invalid token', 401);
  }
  req.user = decoded;
  next();
}

app.get('/health', (req, res) => {
  return successResponse(res, { service: 'analytics-service', status: 'UP', port: PORT });
});

app.get('/kpis', (req, res) => {
  authGuard(req, res, () => {
    const accountDb = new SimpleDb('account-service');
    const accounts = accountDb.get('accounts');

    let totalCashReserveUSD = 0;
    accounts.forEach(a => totalCashReserveUSD += a.balance);

    const kpis = {
      daysSalesOutstanding: 38.4,
      daysPayableOutstanding: 45.2,
      inventoryDaysOutstanding: 22.1,
      cashConversionCycle: 15.3,
      currentRatio: 2.15,
      quickRatio: 1.85,
      operatingCashFlowRatio: 1.42,
      totalCashReserveUSD,
      burnRateMonthlyUSD: 420000.00,
      runwayMonths: parseFloat((totalCashReserveUSD / 420000).toFixed(1)),
      lastCalculatedAt: new Date().toISOString()
    };

    return successResponse(res, kpis, 'Working capital KPIs calculated');
  });
});

app.get('/forecast', (req, res) => {
  authGuard(req, res, () => {
    const days = parseInt(req.query.days || '30', 10);
    const accountDb = new SimpleDb('account-service');
    const accounts = accountDb.get('accounts');

    let currentCashUSD = 0;
    accounts.forEach(a => currentCashUSD += a.balance);

    const forecastData = [];
    const startDate = new Date();

    let projectedBalance = currentCashUSD;
    const numDataPoints = Math.min(Math.max(days, 7), 90);
    const intervalDays = Math.ceil(days / 15);

    for (let i = 0; i <= numDataPoints; i += intervalDays) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);

      const projectedInflow = 120000 + Math.sin(i / 3) * 45000 + Math.random() * 20000;
      const projectedOutflow = 85000 + Math.cos(i / 4) * 35000 + Math.random() * 15000;
      const netFlow = projectedInflow - projectedOutflow;

      if (i > 0) projectedBalance += netFlow;

      forecastData.push({
        dayOffset: i,
        date: d.toISOString().slice(0, 10),
        projectedInflow: Math.round(projectedInflow),
        projectedOutflow: Math.round(projectedOutflow),
        netCashFlow: Math.round(netFlow),
        endingBalanceUSD: Math.round(projectedBalance),
        confidenceInterval: Math.max(95 - i * 0.3, 75).toFixed(1) + '%'
      });
    }

    return successResponse(res, {
      horizonDays: days,
      startingCashUSD: currentCashUSD,
      endingProjectedCashUSD: projectedBalance,
      totalProjectedInflowUSD: forecastData.reduce((acc, f) => acc + f.projectedInflow, 0),
      totalProjectedOutflowUSD: forecastData.reduce((acc, f) => acc + f.projectedOutflow, 0),
      dataPoints: forecastData
    }, `${days}-day cash flow forecast generated`);
  });
});

app.get('/cash-flow-breakdown', (req, res) => {
  authGuard(req, res, () => {
    const breakdown = {
      inflows: [
        { category: 'Customer Receivables', amountUSD: 2450000, percentage: 65.3 },
        { category: 'Subscription Renewals', amountUSD: 850000, percentage: 22.7 },
        { category: 'Interest & Investment Return', amountUSD: 250000, percentage: 6.7 },
        { category: 'Vendor Rebates & Refunds', amountUSD: 200000, percentage: 5.3 }
      ],
      outflows: [
        { category: 'Payroll & Employee Benefits', amountUSD: 1400000, percentage: 44.4 },
        { category: 'Cloud & Tech Infrastructure', amountUSD: 650000, percentage: 20.6 },
        { category: 'Supplier & Inventory Payables', amountUSD: 580000, percentage: 18.4 },
        { category: 'Office Lease & Operations', amountUSD: 320000, percentage: 10.2 },
        { category: 'Tax & Compliance Payments', amountUSD: 200000, percentage: 6.4 }
      ]
    };
    return successResponse(res, breakdown, 'Cash flow category breakdown compiled');
  });
});

app.get('/variance-analysis', (req, res) => {
  authGuard(req, res, () => {
    const varianceData = [
      { period: 'Week 1', forecastedInflow: 650000, actualInflow: 682000, varianceInflow: 32000, varianceInflowPct: 4.9, forecastedOutflow: 480000, actualOutflow: 465000, varianceOutflow: -15000, status: 'Favorable' },
      { period: 'Week 2', forecastedInflow: 720000, actualInflow: 710000, varianceInflow: -10000, varianceInflowPct: -1.4, forecastedOutflow: 520000, actualOutflow: 540000, varianceOutflow: 20000, status: 'Within Range' },
      { period: 'Week 3', forecastedInflow: 580000, actualInflow: 605000, varianceInflow: 25000, varianceInflowPct: 4.3, forecastedOutflow: 410000, actualOutflow: 395000, varianceOutflow: -15000, status: 'Favorable' },
      { period: 'Week 4', forecastedInflow: 810000, actualInflow: 790000, varianceInflow: -20000, varianceInflowPct: -2.5, forecastedOutflow: 600000, actualOutflow: 612000, varianceOutflow: 12000, status: 'Within Range' }
    ];

    return successResponse(res, {
      overallVarianceStatus: 'Favorable (+2.3% Inflow, -0.4% Outflow)',
      accuracyScore: '96.8%',
      weeklyVariance: varianceData
    }, 'Variance analysis compiled');
  });
});

app.listen(PORT, () => {
  console.log(`[Analytics Service] Running on http://localhost:${PORT}`);
});
