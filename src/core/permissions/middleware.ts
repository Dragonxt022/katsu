import type { Request, Response, NextFunction } from 'express';
import { audit } from '../audit/service';

/**
 * RBAC: exige uma permissão específica (ex.: requirePermission('users.delete')).
 * Toda negação de acesso também vai para a auditoria.
 */
export function requirePermission(key: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }
    if (!req.user.permissions.has(key)) {
      audit(req, 'acesso_negado', 'permission', key);
      res.status(403).json({ error: `Permissão negada: ${key}` });
      return;
    }
    next();
  };
}
