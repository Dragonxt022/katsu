import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import type { Express, Router } from 'express';
import { getSqlite } from '../database/connection';
import type { LoadedModule, ModuleManifest, ModuleMenuItem } from './types';

export const CORE_VERSION = '0.1.0';
const MODULES_DIR = path.resolve(process.cwd(), 'src', 'modules');

function validateManifest(m: Partial<ModuleManifest>, dir: string): asserts m is ModuleManifest {
  for (const field of ['id', 'name', 'version', 'requiresCore'] as const) {
    if (!m[field]) throw new Error(`Manifesto inválido em ${dir}: campo "${field}" ausente.`);
  }
}

/** Checagem simples de ">=x.y.z" contra a versão do Core. */
function satisfiesCore(requires: string): boolean {
  const match = requires.match(/>=\s*(\d+)\.(\d+)\.(\d+)/);
  if (!match) return true;
  const req = match.slice(1, 4).map(Number);
  const cur = CORE_VERSION.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (cur[i] > req[i]) return true;
    if (cur[i] < req[i]) return false;
  }
  return true;
}

function findManifest(dir: string): string | null {
  for (const f of ['module.manifest.ts', 'module.manifest.js']) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** import() dinâmico: no Windows exige URL file:// (não aceita C:\...). */
async function importFile(p: string) {
  return import(pathToFileURL(p).href);
}

async function importRouter(dir: string, spec: string | Router): Promise<Router | undefined> {
  if (typeof spec !== 'string') return spec;
  const basePath = path.join(dir, spec);
  const resolved = [basePath, `${basePath}.ts`, `${basePath}.js`].find((p) => fs.existsSync(p));
  if (!resolved) throw new Error(`Arquivo de rotas não encontrado: ${basePath}`);
  const mod = await importFile(resolved);
  return mod.default ?? mod.router;
}

/** Upsert do módulo na tabela `modules` (registro de instalação). */
function registerInDb(m: ModuleManifest): void {
  getSqlite()
    .prepare(
      `INSERT INTO modules (module_id, name, version, uuid, comment)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(module_id) DO UPDATE SET
         name = excluded.name,
         version = excluded.version,
         updated_at = datetime('now')`,
    )
    .run(
      m.id,
      m.name,
      m.version,
      randomUUID(),
      'Registro dos módulos (Apps) instalados: id, nome, versão e estado. O Core lê esta tabela no boot para saber quais Apps carregar.',
    );
}

/** Registra as permissões do manifesto no catálogo e concede tudo ao Administrador. */
function registerPermissions(m: ModuleManifest): void {
  if (!m.permissions?.length) return;
  const db = getSqlite();
  const insertPerm = db.prepare(
    `INSERT INTO permissions (key, description, module) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET description = excluded.description, module = excluded.module`,
  );
  const admin = db.prepare("SELECT id FROM roles WHERE slug = 'administrador'").get() as
    | { id: number }
    | undefined;
  const grant = admin
    ? db.prepare(
        `INSERT INTO role_permissions (role_id, permission_key) VALUES (?, ?)
         ON CONFLICT(role_id, permission_key) DO NOTHING`,
      )
    : null;
  for (const p of m.permissions) {
    const key = typeof p === 'string' ? p : p.key;
    const description = typeof p === 'string' ? key : p.description;
    insertPerm.run(key, description, m.id);
    grant?.run(admin!.id, key);
  }
}

/** Menu agregado de todos os módulos carregados (para a UI). */
export function collectMenu(modules: LoadedModule[]): ModuleMenuItem[] {
  return modules.flatMap((m) => m.manifest.menu ?? []);
}

/** Descobre, valida e carrega todos os módulos em src/modules/. */
export async function loadModules(app: Express): Promise<LoadedModule[]> {
  if (!fs.existsSync(MODULES_DIR)) return [];
  const loaded: LoadedModule[] = [];

  for (const entry of fs.readdirSync(MODULES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(MODULES_DIR, entry.name);
    const manifestPath = findManifest(dir);
    if (!manifestPath) continue;

    const imported = await importFile(manifestPath);
    const manifest: Partial<ModuleManifest> = imported.default ?? imported;
    validateManifest(manifest, dir);

    if (!satisfiesCore(manifest.requiresCore)) {
      console.warn(`[modules] "${manifest.id}" exige Core ${manifest.requiresCore} — ignorado.`);
      continue;
    }

    const router = manifest.routes ? await importRouter(dir, manifest.routes) : undefined;
    if (router) app.use(`/api/${manifest.id}`, router);

    const pagesRouter = manifest.pages ? await importRouter(dir, manifest.pages) : undefined;
    if (pagesRouter) app.use(`/app/${manifest.id}`, pagesRouter);

    const viewsDir = manifest.views ? path.join(dir, manifest.views) : undefined;

    registerInDb(manifest);
    registerPermissions(manifest);
    loaded.push({ manifest, dir, router, pagesRouter, viewsDir });
    console.log(`[modules] carregado: ${manifest.id}@${manifest.version}`);
  }
  return loaded;
}
