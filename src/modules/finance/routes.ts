import { Router } from 'express';
import { getSqlite } from '../../core/database/connection';
import { requirePermission } from '../../core/permissions/middleware';
import { openRegister, closeRegister, currentRegister, expectedCents, addMovement } from './cash';
import { makeBillsRouter } from './bills';

const router = Router();
const db = () => getSqlite();

// ---------- Caixa ----------
router.get('/cash/current', requirePermission('finance.cash.view'), (_req, res) => {
  const reg = currentRegister();
  if (!reg) {
    res.json({ open: false });
    return;
  }
  res.json({ open: true, register: reg, expectedCents: expectedCents(reg.id) });
});

router.get('/cash/movements', requirePermission('finance.cash.view'), (req, res) => {
  const registerId = req.query.registerId ? Number(req.query.registerId) : currentRegister()?.id;
  if (!registerId) {
    res.json([]);
    return;
  }
  res.json(db().prepare(
    `SELECT m.id, m.direction, m.type, m.amount_cents, m.description, m.ref_entity, m.ref_id,
            u.username, m.created_at
     FROM cash_movements m LEFT JOIN users u ON u.id = m.user_id
     WHERE m.register_id = ? ORDER BY m.id DESC`,
  ).all(registerId));
});

router.get('/cash/history', requirePermission('finance.cash.view'), (_req, res) => {
  res.json(db().prepare(
    `SELECT r.id, r.status, r.opened_at, r.opening_cents, r.closed_at, r.expected_cents,
            r.counted_cents, r.difference_cents, uo.username AS opened_by, uc.username AS closed_by
     FROM cash_registers r
     LEFT JOIN users uo ON uo.id = r.opened_by
     LEFT JOIN users uc ON uc.id = r.closed_by
     WHERE r.deleted_at IS NULL ORDER BY r.id DESC LIMIT 50`,
  ).all());
});

router.post('/cash/open', requirePermission('finance.cash.open'), (req, res) => {
  const result = openRegister(req, Math.round(req.body?.openingCents ?? 0));
  if (!result.ok) {
    res.status(400).json(result);
    return;
  }
  res.status(201).json(result);
});

router.post('/cash/close', requirePermission('finance.cash.close'), (req, res) => {
  if (req.body?.countedCents == null) {
    res.status(400).json({ error: 'Informe countedCents (valor contado na gaveta).' });
    return;
  }
  const result = closeRegister(req, Math.round(req.body.countedCents), req.body?.notes);
  if (!result.ok) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

router.post('/cash/movement', requirePermission('finance.cash.move'), (req, res) => {
  const { type, amountCents, description } = req.body ?? {};
  if (!['suprimento', 'sangria'].includes(type) || !amountCents || amountCents <= 0) {
    res.status(400).json({ error: 'Campos: type (suprimento|sangria), amountCents > 0.' });
    return;
  }
  const reg = currentRegister();
  if (!reg) {
    res.status(400).json({ error: 'Nenhum caixa aberto.' });
    return;
  }
  if (type === 'sangria' && Math.round(amountCents) > expectedCents(reg.id)) {
    res.status(400).json({ error: 'Sangria maior que o valor em caixa.' });
    return;
  }
  addMovement(req, reg.id, type === 'suprimento' ? 'entrada' : 'saida', type, Math.round(amountCents), description);
  res.status(201).json({ ok: true, expectedCents: expectedCents(reg.id) });
});

// ---------- Contas a pagar / a receber ----------
router.use('/payables', makeBillsRouter({
  table: 'payables', entity: 'payable', permPrefix: 'finance.payables',
  partyColumn: 'supplier_id', partyTable: 'suppliers',
  settleStatus: 'paga', settleAction: 'pagar', settleDateCol: 'paid_at', settleCentsCol: 'paid_cents',
  movementType: 'pagamento', movementDirection: 'saida', settlePermission: 'finance.payables.pay',
}));
router.use('/receivables', makeBillsRouter({
  table: 'receivables', entity: 'receivable', permPrefix: 'finance.receivables',
  partyColumn: 'customer_id', partyTable: 'customers',
  settleStatus: 'recebida', settleAction: 'receber', settleDateCol: 'received_at', settleCentsCol: 'received_cents',
  movementType: 'recebimento', movementDirection: 'entrada', settlePermission: 'finance.receivables.receive',
}));

// ---------- Fluxo de caixa (DoD: bate com lançamentos) ----------
router.get('/reports/cashflow', requirePermission('finance.reports.view'), (req, res) => {
  const from = String(req.query.from ?? '0000-01-01');
  const to = String(req.query.to ?? '9999-12-31');
  const days = db().prepare(
    `SELECT date(created_at) AS day,
            COALESCE(SUM(CASE WHEN direction = 'entrada' THEN amount_cents END), 0) AS entradas,
            COALESCE(SUM(CASE WHEN direction = 'saida' THEN amount_cents END), 0) AS saidas
     FROM cash_movements
     WHERE date(created_at) BETWEEN ? AND ?
     GROUP BY date(created_at) ORDER BY day`,
  ).all(from, to) as { day: string; entradas: number; saidas: number }[];
  const totals = days.reduce(
    (acc, d) => ({ entradas: acc.entradas + d.entradas, saidas: acc.saidas + d.saidas }),
    { entradas: 0, saidas: 0 },
  );
  res.json({
    from, to,
    days: days.map((d) => ({ ...d, saldo: d.entradas - d.saidas })),
    totals: { ...totals, saldo: totals.entradas - totals.saidas },
  });
});

export default router;
