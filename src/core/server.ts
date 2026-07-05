import express, { type Express } from 'express';
import path from 'node:path';
import { loadModules } from './modules/loader';
import type { LoadedModule } from './modules/types';
import { attachUser, requireAuth } from './auth/middleware';
import authRoutes from './auth/routes';
import usersRoutes from '../core/users/routes';
import auditRoutes from './audit/routes';

export interface KatsuServer {
  app: Express;
  modules: LoadedModule[];
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

  // Rotas do Core protegidas (auth + RBAC por rota)
  app.use('/api/users', requireAuth, usersRoutes);
  app.use('/api/audit', requireAuth, auditRoutes);

  // UI
  app.get('/', requireAuth, (req, res) => {
    res.render('home', { user: req.user });
  });

  // Módulos: toda rota de App exige autenticação por padrão
  app.use('/api', requireAuth);
  const modules = await loadModules(app);

  return { app, modules };
}
