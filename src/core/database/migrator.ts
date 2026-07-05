import fs from 'node:fs';
import path from 'node:path';
import { getSqlite } from './connection';

/**
 * Migrator do Katsu.
 * Cada migration é uma pasta em drizzle/migrations/NNNN_nome/ com up.sql e down.sql.
 * Regra do projeto: toda tabela criada deve ter uma coluna `comment`
 * (TEXT NOT NULL) com DEFAULT descrevendo o objetivo da tabela.
 */
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'drizzle', 'migrations');

function ensureMetaTable(): void {
  getSqlite().exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now')),
      comment TEXT NOT NULL DEFAULT 'Controle interno do migrator: registra quais migrations já foram aplicadas neste banco.'
    );
  `);
}

function listMigrationFolders(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function appliedNames(): Set<string> {
  ensureMetaTable();
  const rows = getSqlite().prepare('SELECT name FROM _migrations ORDER BY name').all() as {
    name: string;
  }[];
  return new Set(rows.map((r) => r.name));
}

export function migrateUp(): string[] {
  const db = getSqlite();
  const applied = appliedNames();
  const executed: string[] = [];
  for (const name of listMigrationFolders()) {
    if (applied.has(name)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name, 'up.sql'), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(name);
    })();
    executed.push(name);
  }
  return executed;
}

/** Reverte a última migration aplicada. */
export function migrateDown(): string | null {
  const db = getSqlite();
  ensureMetaTable();
  const last = db.prepare('SELECT name FROM _migrations ORDER BY name DESC LIMIT 1').get() as
    | { name: string }
    | undefined;
  if (!last) return null;
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, last.name, 'down.sql'), 'utf8');
  db.transaction(() => {
    db.exec(sql);
    db.prepare('DELETE FROM _migrations WHERE name = ?').run(last.name);
  })();
  return last.name;
}

export function migrationStatus(): { name: string; applied: boolean }[] {
  const applied = appliedNames();
  return listMigrationFolders().map((name) => ({ name, applied: applied.has(name) }));
}
