/**
 * Provisiona (ou atualiza) uma empresa no cloud/ para autenticação do motor de sync.
 * Provisionamento manual/CLI nesta sub-fase (6a) — ciclo de vida completo de
 * licença/planos fica para a 6b; o painel administrativo (6d) virá a expor isso numa UI.
 *
 * Uso: tsx src/provision-company.ts <companyUuid> <licenseKey> [nome]
 */
import { getPool, closePool } from './db';
import { hashLicenseKey } from './auth';

async function main(): Promise<void> {
  const [companyUuid, licenseKey, name] = process.argv.slice(2);
  if (!companyUuid || !licenseKey) {
    console.error('Uso: tsx src/provision-company.ts <companyUuid> <licenseKey> [nome]');
    process.exitCode = 1;
    return;
  }
  await getPool().query(
    `INSERT INTO companies (company_uuid, license_key_hash, name) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE license_key_hash = VALUES(license_key_hash), name = VALUES(name)`,
    [companyUuid, hashLicenseKey(licenseKey), name ?? null],
  );
  console.log(`Empresa provisionada: ${companyUuid}`);
  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
