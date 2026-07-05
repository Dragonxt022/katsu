import { createHash } from 'node:crypto';
import os from 'node:os';
import { getSqlite } from '../database/connection';

/**
 * Licenciamento base (KATSU_PLANO.md §7): Machine ID + Empresa UUID + License Key.
 * Validação real contra o servidor virá na Fase 6; aqui fica o contrato local
 * com tolerância offline configurável (não trava operação sem internet).
 */

export type LicenseStatus = 'valida' | 'tolerancia' | 'expirada' | 'sem_licenca';

export interface LicenseInfo {
  status: LicenseStatus;
  machineId: string;
  companyUuid: string | null;
  plan: string | null;
  validUntil: string | null;
  lastValidatedAt: string | null;
  offlineGraceDays: number;
  message: string;
}

/** ID estável desta máquina (não é segredo; identifica a instalação). */
export function machineId(): string {
  const raw = [os.hostname(), os.platform(), os.arch(), os.cpus()[0]?.model ?? ''].join('|');
  return createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

function getRow() {
  return getSqlite().prepare('SELECT * FROM license LIMIT 1').get() as
    | {
        id: number;
        machine_id: string;
        company_uuid: string | null;
        license_key: string | null;
        plan: string | null;
        valid_until: string | null;
        last_validated_at: string | null;
        offline_grace_days: number;
      }
    | undefined;
}

/** Garante que a linha da licença existe (criada no boot). */
export function ensureLicenseRow(): void {
  if (!getRow()) {
    getSqlite()
      .prepare('INSERT INTO license (machine_id) VALUES (?)')
      .run(machineId());
  }
}

export function setLicense(companyUuid: string, licenseKey: string, plan?: string, validUntil?: string): void {
  ensureLicenseRow();
  getSqlite()
    .prepare(
      `UPDATE license SET company_uuid = ?, license_key = ?, plan = COALESCE(?, plan),
       valid_until = COALESCE(?, valid_until), last_validated_at = datetime('now'), updated_at = datetime('now')`,
    )
    .run(companyUuid, licenseKey, plan ?? null, validUntil ?? null);
}

/** Validação local no boot. Nunca trava a operação: apenas informa o status. */
export function validateLicense(): LicenseInfo {
  ensureLicenseRow();
  const row = getRow()!;
  const base = {
    machineId: row.machine_id,
    companyUuid: row.company_uuid,
    plan: row.plan,
    validUntil: row.valid_until,
    lastValidatedAt: row.last_validated_at,
    offlineGraceDays: row.offline_grace_days,
  };

  if (!row.license_key || !row.company_uuid) {
    return { ...base, status: 'sem_licenca', message: 'Instalação sem licença configurada (modo desenvolvimento).' };
  }

  const now = Date.now();
  if (row.valid_until && new Date(row.valid_until).getTime() < now) {
    const grace = row.last_validated_at
      ? new Date(row.last_validated_at).getTime() + row.offline_grace_days * 24 * 3600e3
      : 0;
    if (grace > now) {
      return { ...base, status: 'tolerancia', message: 'Licença vencida — operando em tolerância offline.' };
    }
    return { ...base, status: 'expirada', message: 'Licença expirada. Renove para continuar recebendo atualizações.' };
  }

  return { ...base, status: 'valida', message: 'Licença válida.' };
}
