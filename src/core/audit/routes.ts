import { Router } from 'express';
import { getSqlite } from '../database/connection';
import { requirePermission } from '../permissions/middleware';

const router = Router();

router.get('/', requirePermission('audit.view'), (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 500);
  const rows = getSqlite()
    .prepare(
      `SELECT id, user_id, username, action, entity, entity_id, before_json, after_json, ip, machine, created_at
       FROM audit_logs ORDER BY id DESC LIMIT ?`,
    )
    .all(limit);
  res.json(rows);
});

export default router;
