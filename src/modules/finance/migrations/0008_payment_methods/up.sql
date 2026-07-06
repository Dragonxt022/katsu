-- 0008_payment_methods — formas de pagamento com taxa (ex.: Débito Stone 1,6%).
-- Regra do projeto: toda tabela tem coluna `comment` descrevendo o objetivo da tabela.
-- Taxa em BASIS POINTS (inteiro): 160 = 1,60%. Nunca float.

CREATE TABLE payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('dinheiro', 'debito', 'credito', 'pix', 'prazo', 'outro')),
  fee_bps INTEGER NOT NULL DEFAULT 0 CHECK (fee_bps >= 0 AND fee_bps <= 10000),
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Formas de pagamento aceitas, com taxa da operadora em basis points (160 = 1,6%). O tipo controla o comportamento: dinheiro passa pela gaveta com troco; prazo gera conta a receber.'
);

-- Formas padrão (taxa zero; ajuste na tela conforme sua maquininha)
INSERT INTO payment_methods (name, type, fee_bps, sort, uuid) VALUES
  ('Dinheiro', 'dinheiro', 0, 1, lower(hex(randomblob(16)))),
  ('PIX', 'pix', 0, 2, lower(hex(randomblob(16)))),
  ('Cartão de débito', 'debito', 0, 3, lower(hex(randomblob(16)))),
  ('Cartão de crédito', 'credito', 0, 4, lower(hex(randomblob(16)))),
  ('A prazo (fiado)', 'prazo', 0, 5, lower(hex(randomblob(16))));
