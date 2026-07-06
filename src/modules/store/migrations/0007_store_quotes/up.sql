-- 0007_store_quotes — orçamentos (essencial para material de construção).
-- Regra do projeto: toda tabela tem coluna `comment` descrevendo o objetivo da tabela.

CREATE TABLE quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'convertido', 'cancelado')),
  customer_id INTEGER REFERENCES customers(id),
  customer_name TEXT,
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  valid_until TEXT,
  notes TEXT,
  sale_id INTEGER,
  user_id INTEGER REFERENCES users(id),
  converted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Orçamentos do PDV: proposta com preços congelados e validade. Não mexe em estoque nem caixa; ao converter vira venda honrando os preços cotados.'
);

CREATE TABLE quote_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  qty REAL NOT NULL CHECK (qty > 0),
  unit_price_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT 'Itens do orçamento com preço congelado no momento da cotação (a conversão em venda usa estes valores, não o catálogo atual).'
);

CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);
