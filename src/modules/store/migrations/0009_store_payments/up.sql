-- 0009_store_payments — pagamento múltiplo/dividido e acréscimo na venda.
-- Regra do projeto: toda tabela tem coluna `comment` descrevendo o objetivo da tabela.

ALTER TABLE sales ADD COLUMN surcharge_cents INTEGER NOT NULL DEFAULT 0;

CREATE TABLE sale_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_method_id INTEGER REFERENCES payment_methods(id),
  method_name TEXT NOT NULL,
  method_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  fee_bps INTEGER NOT NULL DEFAULT 0,
  fee_cents INTEGER NOT NULL DEFAULT 0,
  received_cents INTEGER,
  change_cents INTEGER NOT NULL DEFAULT 0,
  receivable_id INTEGER,
  comment TEXT NOT NULL DEFAULT 'Pagamentos da venda (uma venda pode ter várias formas: conta dividida). Nome, tipo e taxa são congelados no momento da venda; fee_cents é a taxa da operadora sobre esta parcela.'
);

CREATE INDEX idx_sale_payments_sale ON sale_payments(sale_id);
