import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('katsu', {
  version: '0.1.0',
});
