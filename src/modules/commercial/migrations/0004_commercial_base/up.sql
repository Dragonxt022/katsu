-- 0004_commercial_base — Fase 3: base transacional (módulo commercial).
-- Regra do projeto: toda tabela tem coluna `comment` descrevendo o objetivo da tabela.
-- Dinheiro sempre em centavos (INTEGER).

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES categories(id),
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Categorias de produtos (hierárquicas via parent_id). Organizam o catálogo de qualquer segmento.'
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  category_id INTEGER REFERENCES categories(id),
  unit TEXT NOT NULL DEFAULT 'un',
  price_cents INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  track_stock INTEGER NOT NULL DEFAULT 1,
  stock_qty REAL NOT NULL DEFAULT 0,
  min_stock REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Catálogo de produtos: preço e custo em centavos, unidade, código de barras e saldo de estoque (stock_qty é mantido pelas movimentações, nunca editado direto).'
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Clientes do estabelecimento: dados de contato e documento (CPF/CNPJ validado pelo Shared). Base para vendas, delivery e financeiro.'
);

CREATE TABLE suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  trade_name TEXT,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Fornecedores: dados cadastrais e documento (CNPJ/CPF). Base para compras e contas a pagar.'
);

CREATE TABLE stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste')),
  qty REAL NOT NULL,
  balance_after REAL NOT NULL,
  reason TEXT,
  ref_entity TEXT,
  ref_id TEXT,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  uuid TEXT NOT NULL UNIQUE,
  comment TEXT NOT NULL DEFAULT 'Livro-razão do estoque (append-only): toda variação de saldo com tipo, quantidade, saldo resultante, motivo, referência (ex.: compra) e usuário. O saldo do produto é sempre consequência destas linhas.'
);

CREATE TABLE purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  status TEXT NOT NULL DEFAULT 'recebida',
  total_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  received_at TEXT,
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Compras de fornecedores. Ao receber, gera movimentações de entrada no estoque e atualiza o custo dos produtos.'
);

CREATE TABLE purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty REAL NOT NULL,
  unit_cost_cents INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT 'Itens de uma compra: produto, quantidade e custo unitário em centavos. Base da entrada de estoque e do custo médio.'
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_movements_product ON stock_movements(product_id, created_at);
CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
