-- 0001_core_foundation
-- Regra do projeto: toda tabela tem coluna `comment` descrevendo o objetivo da tabela.

CREATE TABLE modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  installed_at TEXT NOT NULL DEFAULT (datetime('now')),
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Registro dos módulos (Apps) instalados: id, nome, versão e estado. O Core lê esta tabela no boot para saber quais Apps carregar.'
);

CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  uuid TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  origin_machine TEXT,
  comment TEXT NOT NULL DEFAULT 'Configurações chave-valor do Core: preferências locais e parâmetros de operação do sistema.'
);
