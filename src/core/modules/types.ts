import type { Router } from 'express';

/** Contrato do module.manifest.ts (KATSU_PLANO.md §4). */
export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  requiresCore: string;
  permissions: string[];
  /** Caminho relativo à pasta do módulo, ou Router direto. */
  routes?: string | Router;
  migrations?: string;
  menu?: unknown[];
}

export interface LoadedModule {
  manifest: ModuleManifest;
  dir: string;
  router?: Router;
}
