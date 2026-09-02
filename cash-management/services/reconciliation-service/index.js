const { createApp, SimpleDb, successResponse, errorResponse, verifyToken } = require('../shared/utils');

const app = createApp();
const PORT = process.env.PORT || 5005;

const defaultStatements = [
  {
    id: 'STMT-1001',
    bankRef: 'CHK-BNK-8812',
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    description: 'ACH DEPOSIT - ENTERPRISE CLIENT SUBSCRIPTION',
    amount: 145000.00,
    type: 'CREDIT',
    matchedTxnId: 'TXN-9001',
    matchConfidence: 100,
    status: 'RECONCILED'
  },
  {
    id: 'STMT-1002',
    bankRef: 'CHK-BNK-8813',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    description: 'WIRE OUT - AWS CLOUD INFRASTRUCTURE',
    amount: 68500.00,
    type: 'DEBIT',
    matchedTxnId: 'TXN-9002',
    matchConfidence: 100,
    status: 'RECONCILED'
  },
  {
    id: 'STMT-1003',
    bankRef: 'CHK-BNK-8814',
    date: new Date().toISOString().slice(0, 10),
    description: 'WIRE OUT - GLOBAL HARDWARE SUPPLIER LLC',
    amount: 34250.00,
    type: 'DEBIT',
    matchedTxnId: null,
    matchConfidence: 0,
    status: 'UNRECONCILED'
  },
  {
    id: 'STMT-1004',
    bankRef: 'CHK-BNK-8815',
    date: new Date().toISOString().slice(0, 10),
    description: 'MISC INTEREST CREDIT - GOLDMAN SACHS',
    amount: 12450.00,
    type: 'CREDIT',
    matchedTxnId: null,
    matchConfidence: 0,
    status: 'UNRECONCILED'
  }
];

const defaultAuditLogs = [
  {
    id: 'AUD-1001',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    service: 'auth-service',
    action: 'USER_LOGIN',
    actor: 'admin@corporate.com',
    details: { userId: 'USR-001', role: 'Admin' }
  },
  {
    id: 'AUD-1002',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    service: 'transaction-service',
    action: 'TRANSACTION_INITIATED',
    actor: 'accountant@corporate.com',
    details: { txnId: 'TXN-9003', amount: 250000, currency: 'USD' }
  },
  {
    id: 'AUD-1003',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    service: 'account-service',
    action: 'CASH_SWEEP_EXECUTED',
    actor: 'manager@corporate.com',
    details: { totalSweptUsd: 1400000 }
  }
];

const db = new SimpleDb('reconciliation-service', {
  bankStatements: defaultStatements,
  auditLogs: defaultAuditLogs
});

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
  return successResponse(res, { service: 'reconciliation-service', status: 'UP', port: PORT });
});

app.post('/reconcile/upload', (req, res) => {
  authGuard(req, res, () => {
    const { statements } = req.body;
    if (!Array.isArray(statements) || statements.length === 0) {
      return errorResponse(res, 'Statements array is required', 400);
    }

    const transactionDb = new SimpleDb('transaction-service');
    const ledgerTxns = transactionDb.get('transactions');

    const processedStatements = statements.map((stmt, idx) => {
      let matchedTxn = ledgerTxns.find(t =>
        t.amount === stmt.amount &&
        (t.currency === stmt.currency || !stmt.currency) &&
        t.status === 'COMPLETED'
      );

      let matchConfidence = 0;
      let status = 'UNRECONCILED';
      let matchedTxnId = null;

      if (matchedTxn) {
        matchConfidence = 100;
        status = 'RECONCILED';
        matchedTxnId = matchedTxn.id;
      }

      const newStmt = {
        id: 'STMT-' + (Date.now() + idx),
        bankRef: stmt.bankRef || 'RAW-REF-' + Math.floor(1000 + Math.random() * 9000),
        date: stmt.date || new Date().toISOString().slice(0, 10),
        description: stmt.description || 'Uploaded Bank Entry',
        amount: parseFloat(stmt.amount),
        type: stmt.type || (stmt.amount > 0 ? 'CREDIT' : 'DEBIT'),
        matchedTxnId,
        matchConfidence,
        status
      };

      db.insert('bankStatements', newStmt);
      return newStmt;
    });

    const reconciledCount = processedStatements.filter(s => s.status === 'RECONCILED').length;

    return successResponse(res, {
      totalUploaded: processedStatements.length,
      autoReconciledCount: reconciledCount,
      unreconciledCount: processedStatements.length - reconciledCount,
      items: processedStatements
    }, `Processed ${processedStatements.length} bank statements. ${reconciledCount} items auto-matched.`);
  });
});

app.get('/reconcile/status', (req, res) => {
  authGuard(req, res, () => {
    const statements = db.get('bankStatements');
    const reconciled = statements.filter(s => s.status === 'RECONCILED');
    const unreconciled = statements.filter(s => s.status === 'UNRECONCILED');

    return successResponse(res, {
      totalCount: statements.length,
      reconciledCount: reconciled.length,
      unreconciledCount: unreconciled.length,
      reconciliationRatePct: statements.length ? ((reconciled.length / statements.length) * 100).toFixed(1) : 100,
      statements
    }, 'Reconciliation status summary compiled');
  });
});

app.post('/reconcile/match', (req, res) => {
  authGuard(req, res, () => {
    const { statementId, transactionId } = req.body;
    if (!statementId || !transactionId) {
      return errorResponse(res, 'statementId and transactionId are required', 400);
    }

    const updated = db.update(
      'bankStatements',
      s => s.id === statementId,
      {
        matchedTxnId: transactionId,
        matchConfidence: 100,
        status: 'RECONCILED',
        reconciledBy: req.user.email,
        reconciledAt: new Date().toISOString()
      }
    );

    if (!updated) return errorResponse(res, 'Bank statement not found', 404);

    return successResponse(res, updated, `Statement ${statementId} matched with transaction ${transactionId}`);
  });
});

app.get('/audit-logs', (req, res) => {
  authGuard(req, res, () => {
    const logs = db.get('auditLogs');
    const sorted = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return successResponse(res, sorted, 'Audit logs retrieved');
  });
});

app.listen(PORT, () => {
  console.log(`[Reconciliation Service] Running on http://localhost:${PORT}`);
});
