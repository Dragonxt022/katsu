import { Router, type Request, type Response } from 'express';

/** Páginas do módulo finance (montadas em /app/finance, já autenticadas). */
const router = Router();

function page(view: string, permission: string, extra: Record<string, unknown> = {}) {
  return (req: Request, res: Response) => {
    if (!req.user!.permissions.has(permission)) return res.redirect('/');
    res.render(view, { user: req.user, ...extra });
  };
}

router.get('/caixa', page('finance-cash', 'finance.cash.view'));
router.get('/pagar', page('finance-bills', 'finance.payables.view', {
  bills: { title: 'Contas a pagar', api: '/api/finance/payables', settleLabel: 'Pagar',
    createPerm: 'finance.payables.create', settlePerm: 'finance.payables.pay', editPerm: 'finance.payables.edit',
    partyLabel: 'Fornecedor', settledStatus: 'paga' },
}));
router.get('/receber', page('finance-bills', 'finance.receivables.view', {
  bills: { title: 'Contas a receber', api: '/api/finance/receivables', settleLabel: 'Receber',
    createPerm: 'finance.receivables.create', settlePerm: 'finance.receivables.receive', editPerm: 'finance.receivables.edit',
    partyLabel: 'Cliente', settledStatus: 'recebida' },
}));
router.get('/fluxo', page('finance-cashflow', 'finance.reports.view'));
router.get('/formas-pagamento', page('finance-paymethods', 'finance.paymethods.view'));

export default router;
