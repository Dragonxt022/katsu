import type { Router } from 'express';

/** Item de menu injetado na UI pelo módulo (renderizado conforme permissão). */
export interface ModuleMenuItem {
  label: string;
  href: string;
  permission?: string;
  description?: string;
}

/** Contrato do module.manifest.ts (KATSU_PLANO.md §4). */
export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  requiresCore: string;
  /** Permissões do módulo: registradas no catálogo e concedidas ao Administrador. */
  permissions: { key: string; description: string }[] | string[];
  /** Caminho relativo à pasta do módulo, ou Router direto. Montado em /api/<id>. */
  routes?: string | Router;
  /** Router de páginas (views), montado em /app/<id> com autenticação. */
  pages?: string | Router;
  /** Pasta de views EJS do módulo (relativa), adicionada ao lookup do Express. */
  views?: string;
  /** Pasta de migrations do módulo (o migrator descobre sozinho por convenção). */
  migrations?: string;
  menu?: ModuleMenuItem[];
}

export interface LoadedModule {
  manifest: ModuleManifest;
  dir: string;
  router?: Router;
  pagesRouter?: Router;
  viewsDir?: string;
}
