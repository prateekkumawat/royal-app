const { createApp, SimpleDb, successResponse, errorResponse, verifyToken, logAudit } = require('../shared/utils');

const app = createApp();
const PORT = process.env.PORT || 5002;

const FX_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.4,
  INR: 83.5
};

const defaultAccounts = [
  {
    id: 'ACC-101',
    accountNumber: 'US893710001',
    accountName: 'Main Corporate Operating Account',
    bankName: 'JPMorgan Chase Bank',
    accountType: 'Operating',
    currency: 'USD',
    balance: 4850000.00,
    targetBalance: 3000000.00,
    isConcentrationAccount: true,
    status: 'Active',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ACC-102',
    accountNumber: 'US893710002',
    accountName: 'North America Payroll Account',
    bankName: 'Bank of America',
    accountType: 'Payroll',
    currency: 'USD',
    balance: 1250000.00,
    targetBalance: 1000000.00,
    isConcentrationAccount: false,
    status: 'Active',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ACC-103',
    accountNumber: 'EU441920003',
    accountName: 'European Treasury Account',
    bankName: 'BNP Paribas',
    accountType: 'Operating',
    currency: 'EUR',
    balance: 2100000.00,
    targetBalance: 1500000.00,
    isConcentrationAccount: false,
    status: 'Active',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ACC-104',
    accountNumber: 'UK772180004',
    accountName: 'UK & International Sweep Account',
    bankName: 'HSBC Corporate',
    accountType: 'Sweep',
    currency: 'GBP',
    balance: 890000.00,
    targetBalance: 500000.00,
    isConcentrationAccount: false,
    status: 'Active',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ACC-105',
    accountNumber: 'US893710005',
    accountName: 'Treasury Money Market Fund',
    bankName: 'Goldman Sachs Liquidity',
    accountType: 'Investment',
    currency: 'USD',
    balance: 8500000.00,
    targetBalance: 8000000.00,
    isConcentrationAccount: false,
    status: 'Active',
    updatedAt: new Date().toISOString()
  }
];

const db = new SimpleDb('account-service', { accounts: defaultAccounts, sweepLogs: [] });

function authGuard(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication token required', 401);
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
  return successResponse(res, { service: 'account-service', status: 'UP', port: PORT });
});

app.get('/accounts', (req, res) => {
  authGuard(req, res, () => {
    const accounts = db.get('accounts');
    return successResponse(res, accounts, 'Accounts retrieved');
  });
});

app.get('/accounts/:id', (req, res) => {
  authGuard(req, res, () => {
    const accounts = db.get('accounts');
    const account = accounts.find(a => a.id === req.params.id || a.accountNumber === req.params.id);
    if (!account) return errorResponse(res, 'Account not found', 404);
    return successResponse(res, account, 'Account details retrieved');
  });
});

app.post('/accounts', (req, res) => {
  authGuard(req, res, () => {
    const { accountName, bankName, accountType, currency, balance, targetBalance, isConcentrationAccount } = req.body;
    if (!accountName || !bankName || !currency) {
      return errorResponse(res, 'Account name, bank name, and currency are required', 400);
    }

    const accounts = db.get('accounts');
    const newAccount = {
      id: 'ACC-' + Math.floor(100 + Math.random() * 900),
      accountNumber: 'ACC' + Math.floor(100000000 + Math.random() * 900000000),
      accountName,
      bankName,
      accountType: accountType || 'Operating',
      currency: currency.toUpperCase(),
      balance: parseFloat(balance || 0),
      targetBalance: parseFloat(targetBalance || 0),
      isConcentrationAccount: Boolean(isConcentrationAccount),
      status: 'Active',
      updatedAt: new Date().toISOString()
    };

    db.insert('accounts', newAccount);
    logAudit('account-service', 'ACCOUNT_CREATED', req.user.email, { accountId: newAccount.id, accountName });
    return successResponse(res, newAccount, 'Account created successfully', 201);
  });
});

app.get('/liquidity-summary', (req, res) => {
  authGuard(req, res, () => {
    const accounts = db.get('accounts');

    let totalUsdEquivalent = 0;
    const currencyBreakdown = {};
    const accountTypeBreakdown = {};

    accounts.forEach(acc => {
      const rate = FX_RATES[acc.currency] || 1.0;
      const usdVal = acc.balance / rate;
      totalUsdEquivalent += usdVal;

      if (!currencyBreakdown[acc.currency]) {
        currencyBreakdown[acc.currency] = { count: 0, rawBalance: 0, usdEquivalent: 0 };
      }
      currencyBreakdown[acc.currency].count += 1;
      currencyBreakdown[acc.currency].rawBalance += acc.balance;
      currencyBreakdown[acc.currency].usdEquivalent += usdVal;

      if (!accountTypeBreakdown[acc.accountType]) {
        accountTypeBreakdown[acc.accountType] = { count: 0, usdEquivalent: 0 };
      }
      accountTypeBreakdown[acc.accountType].count += 1;
      accountTypeBreakdown[acc.accountType].usdEquivalent += usdVal;
    });

    return successResponse(res, {
      totalUsdEquivalent,
      totalAccountsCount: accounts.length,
      currencyBreakdown,
      accountTypeBreakdown,
      fxRates: FX_RATES,
      timestamp: new Date().toISOString()
    }, 'Liquidity summary compiled');
  });
});

app.post('/accounts/sweep', (req, res) => {
  authGuard(req, res, () => {
    const accounts = db.get('accounts');
    const concentrationAccount = accounts.find(a => a.isConcentrationAccount);

    if (!concentrationAccount) {
      return errorResponse(res, 'No concentration account designated for cash sweep', 400);
    }

    let totalSweptUsd = 0;
    const sweepEvents = [];

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === concentrationAccount.id || !acc.targetBalance) return acc;

      if (acc.balance > acc.targetBalance) {
        const excess = acc.balance - acc.targetBalance;
        const rate = FX_RATES[acc.currency] || 1.0;
        const excessUsd = excess / rate;

        totalSweptUsd += excessUsd;
        sweepEvents.push({
          sourceAccountId: acc.id,
          sourceAccountName: acc.accountName,
          sweptAmount: excess,
          currency: acc.currency,
          usdValue: excessUsd
        });

        return {
          ...acc,
          balance: acc.targetBalance,
          updatedAt: new Date().toISOString()
        };
      }
      return acc;
    });

    const concIdx = updatedAccounts.findIndex(a => a.id === concentrationAccount.id);
    if (concIdx !== -1) {
      const concRate = FX_RATES[updatedAccounts[concIdx].currency] || 1.0;
      updatedAccounts[concIdx].balance += totalSweptUsd * concRate;
      updatedAccounts[concIdx].updatedAt = new Date().toISOString();
    }

    db.setCollection('accounts', updatedAccounts);

    const sweepRecord = {
      id: 'SWP-' + Date.now(),
      timestamp: new Date().toISOString(),
      executedBy: req.user.email,
      totalSweptUsd,
      sweepEvents
    };

    db.insert('sweepLogs', sweepRecord);
    logAudit('account-service', 'CASH_SWEEP_EXECUTED', req.user.email, { totalSweptUsd, sweepEventsCount: sweepEvents.length });

    return successResponse(res, sweepRecord, `Automated Cash Sweep executed. Swept $${totalSweptUsd.toLocaleString()} USD equivalent.`);
  });
});

app.listen(PORT, () => {
  console.log(`[Account Service] Running on http://localhost:${PORT}`);
});
