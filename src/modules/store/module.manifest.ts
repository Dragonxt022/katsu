import type { ModuleManifest } from '../../core/modules/types';

const manifest: ModuleManifest = {
  id: 'store',
  name: 'Loja (PDV e vendas)',
  version: '1.0.0',
  requiresCore: '>=0.1.0',
  permissions: [
    { key: 'store.sales.view', description: 'Visualizar vendas' },
    { key: 'store.sales.create', description: 'Realizar vendas (PDV)' },
    { key: 'store.sales.discount', description: 'Aplicar desconto na venda' },
    { key: 'store.sales.cancel', description: 'Cancelar vendas' },
    { key: 'store.reports.view', description: 'Visualizar relatório de vendas' },
    { key: 'store.quotes.view', description: 'Visualizar orçamentos' },
    { key: 'store.quotes.create', description: 'Criar e cancelar orçamentos' },
  ],
  routes: './routes',
  pages: './pages',
  views: './views',
  migrations: './migrations',
  menu: [
    { label: 'PDV', href: '/app/store/pdv', permission: 'store.sales.create', description: 'Frente de caixa: vender rápido.', icon: 'cart' },
    { label: 'Vendas', href: '/app/store/vendas', permission: 'store.sales.view', description: 'Histórico e relatório do dia.', icon: 'receipt' },
    { label: 'Orçamentos', href: '/app/store/orcamentos', permission: 'store.quotes.view', description: 'Cotações com validade; converta em venda.', icon: 'clipboard' },
  ],
};

export default manifest;
