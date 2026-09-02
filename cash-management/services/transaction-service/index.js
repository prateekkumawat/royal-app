const { createApp, SimpleDb, successResponse, errorResponse, verifyToken, logAudit } = require('../shared/utils');

const app = createApp();
const PORT = process.env.PORT || 5003;

const APPROVAL_THRESHOLD_USD = 10000;

const defaultTransactions = [
  {
    id: 'TXN-9001',
    referenceNo: 'REF-20260817-001',
    type: 'INFLOW',
    category: 'Customer Receivable',
    sourceAccountId: 'EXT-9981',
    destinationAccountId: 'ACC-101',
    amount: 145000.00,
    currency: 'USD',
    status: 'COMPLETED',
    description: 'Enterprise Client Q3 Subscription Payment',
    initiatedBy: 'accountant@corporate.com',
    approvedBy: 'manager@corporate.com',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'TXN-9002',
    referenceNo: 'REF-20260817-002',
    type: 'OUTFLOW',
    category: 'Vendor Disbursement',
    sourceAccountId: 'ACC-101',
    destinationAccountId: 'EXT-5542',
    amount: 68500.00,
    currency: 'USD',
    status: 'COMPLETED',
    description: 'AWS Cloud Infrastructure Monthly Invoice',
    initiatedBy: 'accountant@corporate.com',
    approvedBy: 'manager@corporate.com',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'TXN-9003',
    referenceNo: 'REF-20260817-003',
    type: 'INTERNAL_TRANSFER',
    category: 'Liquidity Rebalancing',
    sourceAccountId: 'ACC-101',
    destinationAccountId: 'ACC-102',
    amount: 250000.00,
    currency: 'USD',
    status: 'PENDING_APPROVAL',
    description: 'Weekly Payroll Funding Transfer',
    initiatedBy: 'accountant@corporate.com',
    approvedBy: null,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'TXN-9004',
    referenceNo: 'REF-20260817-004',
    type: 'OUTFLOW',
    category: 'Tax & Compliance',
    sourceAccountId: 'ACC-103',
    destinationAccountId: 'EXT-1120',
    amount: 42000.00,
    currency: 'EUR',
    status: 'PENDING_APPROVAL',
    description: 'EU Quarterly VAT Payment',
    initiatedBy: 'accountant@corporate.com',
    approvedBy: null,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

const db = new SimpleDb('transaction-service', { transactions: defaultTransactions });

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
  return successResponse(res, { service: 'transaction-service', status: 'UP', port: PORT });
});

app.get('/transactions', (req, res) => {
  authGuard(req, res, () => {
    const transactions = db.get('transactions');
    const { status, type } = req.query;

    let filtered = transactions;
    if (status) {
      filtered = filtered.filter(t => t.status.toUpperCase() === status.toUpperCase());
    }
    if (type) {
      filtered = filtered.filter(t => t.type.toUpperCase() === type.toUpperCase());
    }

    return successResponse(res, filtered, 'Transactions retrieved');
  });
});

app.get('/pending-approvals', (req, res) => {
  authGuard(req, res, () => {
    const transactions = db.get('transactions');
    const pending = transactions.filter(t => t.status === 'PENDING_APPROVAL');
    return successResponse(res, pending, 'Pending approvals retrieved');
  });
});

app.post('/transactions', (req, res) => {
  authGuard(req, res, () => {
    const { type, category, sourceAccountId, destinationAccountId, amount, currency, description } = req.body;
    if (!type || !amount || !currency) {
      return errorResponse(res, 'Type, amount, and currency are required', 400);
    }

    const numAmount = parseFloat(amount);
    const requiresApproval = numAmount >= APPROVAL_THRESHOLD_USD;
    const status = requiresApproval ? 'PENDING_APPROVAL' : 'COMPLETED';

    const newTxn = {
      id: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
      referenceNo: 'REF-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900),
      type: type.toUpperCase(),
      category: category || 'General Transfer',
      sourceAccountId: sourceAccountId || 'MAIN-ACC',
      destinationAccountId: destinationAccountId || 'DEST-ACC',
      amount: numAmount,
      currency: currency.toUpperCase(),
      status,
      description: description || 'Cash management transaction',
      initiatedBy: req.user.email,
      approvedBy: requiresApproval ? null : 'SYSTEM_AUTO_APPROVE',
      createdAt: new Date().toISOString()
    };

    db.insert('transactions', newTxn);
    logAudit('transaction-service', 'TRANSACTION_INITIATED', req.user.email, {
      txnId: newTxn.id,
      amount: newTxn.amount,
      currency: newTxn.currency,
      status
    });

    const message = requiresApproval
      ? `Transaction ${newTxn.id} created and routed to Manager Dual-Approval Queue (Amount >= $10,000)`
      : `Transaction ${newTxn.id} completed immediately.`;

    return successResponse(res, newTxn, message, 201);
  });
});

app.post('/transactions/:id/approve', (req, res) => {
  authGuard(req, res, () => {
    if (req.user.role !== 'Admin' && req.user.role !== 'Treasury_Manager') {
      return errorResponse(res, 'Dual-control approval requires Treasury_Manager or Admin role', 403);
    }

    const transactions = db.get('transactions');
    const txn = transactions.find(t => t.id === req.params.id);
    if (!txn) return errorResponse(res, 'Transaction not found', 404);

    if (txn.status !== 'PENDING_APPROVAL') {
      return errorResponse(res, `Transaction is currently in ${txn.status} state and cannot be approved`, 400);
    }

    if (txn.initiatedBy === req.user.email) {
      return errorResponse(res, 'Dual-control segregation violation: Initiator cannot approve their own transfer', 400);
    }

    const updatedTxn = db.update(
      'transactions',
      t => t.id === req.params.id,
      {
        status: 'COMPLETED',
        approvedBy: req.user.email,
        approvedAt: new Date().toISOString()
      }
    );

    logAudit('transaction-service', 'TRANSACTION_APPROVED', req.user.email, { txnId: updatedTxn.id, amount: updatedTxn.amount });
    return successResponse(res, updatedTxn, `Transaction ${updatedTxn.id} successfully approved and executed.`);
  });
});

app.post('/transactions/:id/reject', (req, res) => {
  authGuard(req, res, () => {
    if (req.user.role !== 'Admin' && req.user.role !== 'Treasury_Manager') {
      return errorResponse(res, 'Rejection requires Treasury_Manager or Admin role', 403);
    }

    const transactions = db.get('transactions');
    const txn = transactions.find(t => t.id === req.params.id);
    if (!txn) return errorResponse(res, 'Transaction not found', 404);

    const { reason } = req.body;

    const updatedTxn = db.update(
      'transactions',
      t => t.id === req.params.id,
      {
        status: 'REJECTED',
        rejectionReason: reason || 'Rejected by Manager',
        rejectedBy: req.user.email,
        rejectedAt: new Date().toISOString()
      }
    );

    logAudit('transaction-service', 'TRANSACTION_REJECTED', req.user.email, { txnId: updatedTxn.id, reason });
    return successResponse(res, updatedTxn, `Transaction ${updatedTxn.id} rejected.`);
  });
});

app.listen(PORT, () => {
  console.log(`[Transaction Service] Running on http://localhost:${PORT}`);
});
