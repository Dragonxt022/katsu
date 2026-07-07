/**
 * Provisiona (ou atualiza) uma empresa no cloud/ para autenticação do motor de sync
 * e para o ciclo de licenciamento remoto (Fase 6b: plano + módulos habilitados).
 * Provisionamento manual/CLI nesta sub-fase — o painel administrativo (6d) virá a
 * expor isso numa UI.
 *
 * Uso: tsx src/provision-company.ts <companyUuid> <licenseKey> [nome] [--plan <nome>] [--modules <a,b,c>]
 */
import { getPool, closePool } from './db';
import { hashLicenseKey } from './auth';

function parseArgs(argv: string[]): { positional: string[]; plan: string | null; modules: string[] | null } {
  const positional: string[] = [];
  let plan: string | null = null;
  let modules: string[] | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--plan') {
      plan = argv[++i] ?? null;
    } else if (argv[i] === '--modules') {
      modules = (argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      positional.push(argv[i]);
    }
  }
  return { positional, plan, modules };
}

async function main(): Promise<void> {
  const { positional, plan, modules } = parseArgs(process.argv.slice(2));
  const [companyUuid, licenseKey, name] = positional;
  if (!companyUuid || !licenseKey) {
    console.error('Uso: tsx src/provision-company.ts <companyUuid> <licenseKey> [nome] [--plan <nome>] [--modules <a,b,c>]');
    process.exitCode = 1;
    return;
  }
  await getPool().query(
    `INSERT INTO companies (company_uuid, license_key_hash, name, plan, modules) VALUES (?, ?, ?, ?, CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE
       license_key_hash = VALUES(license_key_hash),
       name = VALUES(name),
       plan = COALESCE(VALUES(plan), plan),
       modules = COALESCE(VALUES(modules), modules)`,
    [companyUuid, hashLicenseKey(licenseKey), name ?? null, plan, modules ? JSON.stringify(modules) : null],
  );
  console.log(`Empresa provisionada: ${companyUuid}${plan ? ` (plano: ${plan})` : ''}${modules ? ` módulos: ${modules.join(', ')}` : ''}`);
  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
