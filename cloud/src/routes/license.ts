import { Router } from 'express';
import { getPool } from '../db';
import { requireCompanyAuth, type AuthedRequest } from '../auth';

const router = Router();

interface CompanyLicenseRow {
  plan: string | null;
  modules: string[] | string | null;
  valid_until: string | null;
}

router.get('/validate', requireCompanyAuth, async (req: AuthedRequest, res) => {
  const [rows] = await getPool().query('SELECT plan, modules, valid_until FROM companies WHERE company_uuid = ?', [
    req.companyUuid,
  ]);
  const company = (rows as CompanyLicenseRow[])[0];
  // `modules` NULL = nunca configurado no cloud/ (sem restrição ainda, fail-open) —
  // diferente de `[]` (configurado explicitamente como "nenhum módulo"), que bloqueia tudo.
  const modules = company?.modules == null ? null : typeof company.modules === 'string' ? JSON.parse(company.modules) : company.modules;
  res.json({
    plan: company?.plan ?? null,
    modules,
    validUntil: company?.valid_until ?? null,
  });
});

export default router;
