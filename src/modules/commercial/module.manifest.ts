import type { ModuleManifest } from '../../core/modules/types';

const manifest: ModuleManifest = {
  id: 'commercial',
  name: 'Comercial (cadastros e estoque)',
  version: '1.0.0',
  requiresCore: '>=0.1.0',
  permissions: [
    { key: 'commercial.customers.view', description: 'Visualizar clientes' },
    { key: 'commercial.customers.create', description: 'Criar clientes' },
    { key: 'commercial.customers.edit', description: 'Editar clientes' },
    { key: 'commercial.customers.delete', description: 'Excluir clientes' },
    { key: 'commercial.suppliers.view', description: 'Visualizar fornecedores' },
    { key: 'commercial.suppliers.create', description: 'Criar fornecedores' },
    { key: 'commercial.suppliers.edit', description: 'Editar fornecedores' },
    { key: 'commercial.suppliers.delete', description: 'Excluir fornecedores' },
    { key: 'commercial.products.view', description: 'Visualizar produtos' },
    { key: 'commercial.products.create', description: 'Criar produtos' },
    { key: 'commercial.products.edit', description: 'Editar produtos (exceto preço)' },
    { key: 'commercial.products.delete', description: 'Excluir produtos' },
    { key: 'commercial.products.price', description: 'Alterar preço de produtos' },
    { key: 'commercial.stock.view', description: 'Visualizar estoque e movimentações' },
    { key: 'commercial.stock.move', description: 'Movimentar estoque (entrada/saída/ajuste)' },
    { key: 'commercial.purchases.view', description: 'Visualizar compras' },
    { key: 'commercial.purchases.create', description: 'Registrar compras' },
    { key: 'commercial.purchases.edit', description: 'Editar dados da compra (fornecedor, observações)' },
    { key: 'commercial.purchases.cancel', description: 'Cancelar compra (reverte estoque)' },
  ],
  routes: './routes',
  pages: './pages',
  views: './views',
  migrations: './migrations',
  setup: './setup',
  menu: [
    { label: 'Clientes', href: '/app/commercial/clientes', permission: 'commercial.customers.view', description: 'Cadastro de clientes.', icon: 'users' },
    { label: 'Fornecedores', href: '/app/commercial/fornecedores', permission: 'commercial.suppliers.view', description: 'Cadastro de fornecedores.', icon: 'truck' },
    { label: 'Produtos', href: '/app/commercial/produtos', permission: 'commercial.products.view', description: 'Catálogo, preços e estoque.', icon: 'package' },
    { label: 'Compras', href: '/app/commercial/compras', permission: 'commercial.purchases.view', description: 'Recebimento de mercadoria e custos.', icon: 'bag' },
  ],
};

export default manifest;
