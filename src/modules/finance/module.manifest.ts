import type { ModuleManifest } from '../../core/modules/types';

const manifest: ModuleManifest = {
  id: 'finance',
  name: 'Financeiro (caixa e contas)',
  version: '1.0.0',
  requiresCore: '>=0.1.0',
  permissions: [
    { key: 'finance.cash.view', description: 'Visualizar caixa e movimentos' },
    { key: 'finance.cash.open', description: 'Abrir caixa' },
    { key: 'finance.cash.close', description: 'Fechar caixa' },
    { key: 'finance.cash.move', description: 'Suprimento e sangria' },
    { key: 'finance.payables.view', description: 'Visualizar contas a pagar' },
    { key: 'finance.payables.create', description: 'Criar contas a pagar' },
    { key: 'finance.payables.edit', description: 'Editar/cancelar contas a pagar' },
    { key: 'finance.payables.pay', description: 'Pagar contas' },
    { key: 'finance.receivables.view', description: 'Visualizar contas a receber' },
    { key: 'finance.receivables.create', description: 'Criar contas a receber' },
    { key: 'finance.receivables.edit', description: 'Editar/cancelar contas a receber' },
    { key: 'finance.receivables.receive', description: 'Receber contas' },
    { key: 'finance.reports.view', description: 'Visualizar fluxo de caixa e relatórios' },
    { key: 'finance.paymethods.view', description: 'Visualizar formas de pagamento' },
    { key: 'finance.paymethods.edit', description: 'Cadastrar/editar formas de pagamento e taxas' },
  ],
  routes: './routes',
  pages: './pages',
  views: './views',
  migrations: './migrations',
  setup: './setup',
  menu: [
    { label: 'Caixa', href: '/app/finance/caixa', permission: 'finance.cash.view', description: 'Abertura, fechamento, suprimento e sangria.', icon: 'wallet' },
    { label: 'A pagar', href: '/app/finance/pagar', permission: 'finance.payables.view', description: 'Contas a pagar e vencimentos.', icon: 'credit-card' },
    { label: 'A receber', href: '/app/finance/receber', permission: 'finance.receivables.view', description: 'Contas a receber e vencimentos.', icon: 'dollar-sign' },
    { label: 'Fluxo', href: '/app/finance/fluxo', permission: 'finance.reports.view', description: 'Fluxo de caixa por dia.', icon: 'chart' },
    { label: 'Pagamentos', href: '/app/finance/formas-pagamento', permission: 'finance.paymethods.view', description: 'Formas de pagamento e taxas das maquininhas.', icon: 'credit-card' },
  ],
};

export default manifest;
