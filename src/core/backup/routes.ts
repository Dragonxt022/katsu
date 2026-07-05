import { Router } from 'express';
import { requirePermission } from '../permissions/middleware';
import { audit } from '../audit/service';
import { runBackup, restoreBackup, listBackups } from './service';

const router = Router();

router.get('/', requirePermission('backup.view'), (_req, res) => {
  res.json(listBackups());
});

router.post('/', requirePermission('backup.run'), async (req, res) => {
  try {
    const result = await runBackup('manual');
    audit(req, 'backup', 'backup', result.id, null, result);
    res.status(201).json(result);
  } catch (e) {
    res.status(500).json({ error: `Falha no backup: ${String(e)}` });
  }
});

router.post('/:id/restore', requirePermission('backup.restore'), (req, res) => {
  const id = Number(req.params.id);
  const result = restoreBackup(id);
  audit(req, result.ok ? 'restaurar' : 'restaurar_falhou', 'backup', id, null, result);
  if (!result.ok) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

export default router;
