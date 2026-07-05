import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import { getSqlite, closeDb } from '../database/connection';

/**
 * Backup local (KATSU_PLANO.md §8):
 * compacta o SQLite (gzip), calcula checksum sha256 e registra no histórico.
 * Destino configurável via setting `backup.dir`. Restauração validada por checksum.
 */

function backupDir(): string {
  const row = getSqlite()
    .prepare("SELECT value FROM settings WHERE key = 'backup.dir' AND deleted_at IS NULL")
    .get() as { value: string | null } | undefined;
  const dir = row?.value || path.resolve(process.cwd(), 'storage', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

export interface BackupResult {
  id: number;
  filePath: string;
  sizeBytes: number;
  checksum: string;
}

export async function runBackup(trigger: 'manual' | 'agendado' = 'manual'): Promise<BackupResult> {
  const db = getSqlite();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tmpDb = path.join(backupDir(), `katsu-${stamp}.db`);
  const finalPath = `${tmpDb}.gz`;

  await db.backup(tmpDb); // cópia consistente mesmo com o banco em uso
  const compressed = gzipSync(fs.readFileSync(tmpDb));
  fs.writeFileSync(finalPath, compressed);
  fs.unlinkSync(tmpDb);

  const checksum = sha256(compressed);
  const info = db
    .prepare(
      `INSERT INTO backups (file_path, size_bytes, checksum, trigger, uuid) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(finalPath, compressed.length, checksum, trigger, randomUUID());

  return { id: Number(info.lastInsertRowid), filePath: finalPath, sizeBytes: compressed.length, checksum };
}

/** Restaura um backup do histórico. Valida checksum antes de tocar no banco. */
export function restoreBackup(backupId: number): { ok: boolean; error?: string } {
  const db = getSqlite();
  const row = db.prepare('SELECT file_path, checksum FROM backups WHERE id = ?').get(backupId) as
    | { file_path: string; checksum: string }
    | undefined;
  if (!row) return { ok: false, error: 'Backup não encontrado.' };
  if (!fs.existsSync(row.file_path)) return { ok: false, error: 'Arquivo de backup não existe mais.' };

  const compressed = fs.readFileSync(row.file_path);
  if (sha256(compressed) !== row.checksum) {
    return { ok: false, error: 'Checksum inválido — arquivo corrompido, restauração abortada.' };
  }

  const data = gunzipSync(compressed);
  const dbPath = (db as unknown as { name: string }).name;
  closeDb();
  fs.writeFileSync(dbPath, data);
  getSqlite(); // reabre
  return { ok: true };
}

export function listBackups() {
  return getSqlite()
    .prepare('SELECT id, file_path, size_bytes, checksum, trigger, status, created_at FROM backups ORDER BY id DESC LIMIT 100')
    .all();
}

/** Agendador: backup diário às 23:00 (verifica a cada minuto, sem duplicar no dia). */
export function startBackupScheduler(): NodeJS.Timeout {
  const timer = setInterval(async () => {
    const now = new Date();
    if (now.getHours() !== 23 || now.getMinutes() !== 0) return;
    const today = now.toISOString().slice(0, 10);
    const last = getSqlite()
      .prepare("SELECT 1 FROM backups WHERE trigger = 'agendado' AND date(created_at) = ?")
      .get(today);
    if (!last) {
      try {
        await runBackup('agendado');
        console.log('[backup] backup diário concluído.');
      } catch (e) {
        console.error('[backup] falha no backup agendado:', e);
      }
    }
  }, 60_000);
  timer.unref(); // não impede o processo de encerrar
  return timer;
}
