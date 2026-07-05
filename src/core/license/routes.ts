import { Router } from 'express';
import { requirePermission } from '../permissions/middleware';
import { audit } from '../audit/service';
import { validateLicense, setLicense } from './service';

const router = Router();

router.get('/', requirePermission('license.view'), (_req, res) => {
  res.json(validateLicense());
});

router.put('/', requirePermission('license.edit'), (req, res) => {
  const { companyUuid, licenseKey, plan, validUntil } = req.body ?? {};
  if (!companyUuid || !licenseKey) {
    res.status(400).json({ error: 'Campos obrigatórios: companyUuid, licenseKey.' });
    return;
  }
  const before = validateLicense();
  setLicense(String(companyUuid), String(licenseKey), plan, validUntil);
  const after = validateLicense();
  audit(req, 'editar', 'license', 1, before, after);
  res.json(after);
});

export default router;
