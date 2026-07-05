-- 0005_finance_base — Fase 4: caixa, contas a pagar e a receber (módulo finance).
-- Regra do projeto: toda tabela tem coluna `comment` descrevendo o objetivo da tabela.
-- Dinheiro sempre em centavos (INTEGER).

CREATE TABLE cash_registers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
  opened_by INTEGER NOT NULL REFERENCES users(id),
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  opening_cents INTEGER NOT NULL DEFAULT 0,
  closed_by INTEGER REFERENCES users(id),
  closed_at TEXT,
  expected_cents INTEGER,
  counted_cents INTEGER,
  difference_cents INTEGER,
  notes TEXT,
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Sessões de caixa: abertura com fundo de troco, fechamento com valor esperado (calculado dos movimentos) vs contado e diferença. Só pode haver uma sessão aberta por vez.'
);

CREATE TABLE cash_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  register_id INTEGER NOT NULL REFERENCES cash_registers(id),
  direction TEXT NOT NULL CHECK (direction IN ('entrada', 'saida')),
  type TEXT NOT NULL CHECK (type IN ('abertura', 'suprimento', 'sangria', 'venda', 'recebimento', 'pagamento')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  description TEXT,
  ref_entity TEXT,
  ref_id TEXT,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  uuid TEXT NOT NULL UNIQUE,
  comment TEXT NOT NULL DEFAULT 'Livro-razão do caixa (append-only): todo dinheiro que entra ou sai da gaveta, com tipo, valor, referência (conta paga/recebida, venda) e usuário. O valor esperado no fechamento é consequência destas linhas.'
);

CREATE TABLE payables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'paga', 'cancelada')),
  paid_at TEXT,
  paid_cents INTEGER,
  notes TEXT,
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Contas a pagar: obrigações com vencimento e valor em centavos. Pagamento com caixa aberto gera movimento de saída na gaveta.'
);

CREATE TABLE receivables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'recebida', 'cancelada')),
  received_at TEXT,
  received_cents INTEGER,
  notes TEXT,
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Contas a receber: créditos com vencimento e valor em centavos. Recebimento com caixa aberto gera movimento de entrada na gaveta.'
);

CREATE INDEX idx_cash_movements_register ON cash_movements(register_id);
CREATE INDEX idx_payables_status_due ON payables(status, due_date);
CREATE INDEX idx_receivables_status_due ON receivables(status, due_date);
