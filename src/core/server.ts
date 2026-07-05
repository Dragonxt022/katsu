import express, { type Express } from 'express';
import path from 'node:path';
import { loadModules } from './modules/loader';
import type { LoadedModule } from './modules/types';

export interface KatsuServer {
  app: Express;
  modules: LoadedModule[];
}

/** Cria a API local (Express 5) e carrega os módulos via manifesto. */
export async function createServer(): Promise<KatsuServer> {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.resolve(process.cwd(), 'src', 'public')));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, name: 'katsu', ts: new Date().toISOString() });
  });

  const modules = await loadModules(app);
  return { app, modules };
}
