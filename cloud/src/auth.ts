import { createHash } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { getPool } from './db';

export function hashLicenseKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export interface AuthedRequest extends Request {
  companyUuid?: string;
}

/**
 * Autenticação mínima da 6a: par company_uuid + license_key (o mesmo já guardado
 * localmente em `license` no Katsu). Sessão/JWT de verdade fica para a 6b.
 */
export async function requireCompanyAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const companyUuid = req.header('X-Katsu-Company');
  const licenseKey = req.header('X-Katsu-License-Key');
  if (!companyUuid || !licenseKey) {
    res.status(401).json({ error: 'Credenciais ausentes (X-Katsu-Company / X-Katsu-License-Key).' });
    return;
  }
  const [rows] = await getPool().query('SELECT license_key_hash FROM companies WHERE company_uuid = ?', [
    companyUuid,
  ]);
  const company = (rows as { license_key_hash: string }[])[0];
  if (!company || company.license_key_hash !== hashLicenseKey(licenseKey)) {
    res.status(401).json({ error: 'Credenciais inválidas.' });
    return;
  }
  req.companyUuid = companyUuid;
  next();
}
