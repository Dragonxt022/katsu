import type { ModuleManifest } from '../../core/modules/types';

const manifest: ModuleManifest = {
  id: 'hello',
  name: 'Hello (módulo de teste da Fase 0)',
  version: '1.0.0',
  requiresCore: '>=0.1.0',
  permissions: ['hello.view'],
  routes: './routes',
  menu: [],
};

export default manifest;
