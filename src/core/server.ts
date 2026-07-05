import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import { loadModules } from './modules/loader';
import type { LoadedModule } from './modules/types';
import { attachUser, requireAuth } from './auth/middleware';
import authRoutes from './auth/routes';
import usersRoutes from './users/routes';
import auditRoutes from './audit/routes';
import settingsRoutes from './config/routes';
import backupRoutes from './backup/routes';
import licenseRoutes from './license/routes';
import { startBackupScheduler } from './backup/service';
import { validateLicense } from './license/service';

export interface KatsuServer {
  app: Express;
  modules: LoadedModule[];
}

/** Página protegida por permissão: sem permissão → volta para a home. */
function page(view: string, permission?: string) {
  return (req: Request, res: Response, _next: NextFunction) => {
    if (permission && !req.user!.permissions.has(permission)) return res.redirect('/');
    res.render(view, { user: req.user });
  };
}

/** Cria a API local (Express 5) + views EJS e carrega os módulos via manifesto. */
export async function createServer(): Promise<KatsuServer> {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.resolve(process.cwd(), 'src', 'views'));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.resolve(process.cwd(), 'src', 'public')));
  app.use(attachUser);

  // Rotas públicas
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, name: 'katsu', ts: new Date().toISOString() });
  });
  app.use('/api/auth', authRoutes);
  app.get('/login', (req, res) => {
    if (req.user) return res.redirect('/');
    res.render('login');
  });

  // API do Core (auth + RBAC por rota)
  app.use('/api/users', requireAuth, usersRoutes);
  app.use('/api/audit', requireAuth, auditRoutes);
  app.use('/api/settings', requireAuth, settingsRoutes);
  app.use('/api/backup', requireAuth, backupRoutes);
  app.use('/api/license', requireAuth, licenseRoutes);

  // Páginas
  app.get('/', requireAuth, page('home'));
  app.get('/admin/usuarios', requireAuth, page('users', 'users.view'));
  app.get('/admin/auditoria', requireAuth, page('audit', 'audit.view'));
  app.get('/admin/backup', requireAuth, page('backup', 'backup.view'));
  app.get('/admin/configuracoes', requireAuth, page('settings', 'settings.view'));

  // Módulos: toda rota de App exige autenticação por padrão
  app.use('/api', requireAuth);
  const modules = await loadModules(app);

  // Licença (não trava o boot) e backup diário às 23:00
  const lic = validateLicense();
  console.log(`[license] ${lic.status}: ${lic.message}`);
  startBackupScheduler();

  return { app, modules };
}
