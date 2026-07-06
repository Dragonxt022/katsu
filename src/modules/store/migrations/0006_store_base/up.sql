-- 0006_store_base — Fase 5: App Loja (varejo: material de construção, mercado, roupas...).
-- Regra do projeto: toda tabela tem coluna `comment` descrevendo o objetivo da tabela.
-- Dinheiro sempre em centavos (INTEGER).

CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL DEFAULT 'concluida' CHECK (status IN ('concluida', 'cancelada')),
  customer_id INTEGER REFERENCES customers(id),
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'prazo')),
  paid_cents INTEGER,
  change_cents INTEGER NOT NULL DEFAULT 0,
  receivable_id INTEGER,
  cash_register_id INTEGER,
  user_id INTEGER REFERENCES users(id),
  canceled_at TEXT,
  canceled_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Vendas do PDV: totais em centavos, forma de pagamento, troco, vínculo com a sessão de caixa (dinheiro) ou conta a receber (prazo). Cancelamento reverte estoque e gaveta.'
);

CREATE TABLE sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  qty REAL NOT NULL CHECK (qty > 0),
  unit_price_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT 'Itens da venda com preço praticado no momento (product_name e unit_price_cents são congelados: mudanças futuras no catálogo não alteram vendas passadas).'
);

CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
