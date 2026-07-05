import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Express, Router } from 'express';
import { getSqlite } from '../database/connection';
import type { LoadedModule, ModuleManifest } from './types';

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

/** Descobre, valida e carrega todos os módulos em src/modules/. */
export async function loadModules(app: Express): Promise<LoadedModule[]> {
  if (!fs.existsSync(MODULES_DIR)) return [];
  const loaded: LoadedModule[] = [];

  for (const entry of fs.readdirSync(MODULES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(MODULES_DIR, entry.name);
    const manifestPath = findManifest(dir);
    if (!manifestPath) continue;

    const imported = await import(manifestPath);
    const manifest: Partial<ModuleManifest> = imported.default ?? imported;
    validateManifest(manifest, dir);

    if (!satisfiesCore(manifest.requiresCore)) {
      console.warn(`[modules] "${manifest.id}" exige Core ${manifest.requiresCore} — ignorado.`);
      continue;
    }

    let router: Router | undefined;
    if (typeof manifest.routes === 'string') {
      const routesModule = await import(path.join(dir, manifest.routes));
      router = routesModule.default ?? routesModule.router;
    } else if (manifest.routes) {
      router = manifest.routes;
    }
    if (router) app.use(`/api/${manifest.id}`, router);

    registerInDb(manifest);
    loaded.push({ manifest, dir, router });
    console.log(`[modules] carregado: ${manifest.id}@${manifest.version}`);
  }
  return loaded;
}
