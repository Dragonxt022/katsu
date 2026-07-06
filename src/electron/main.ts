import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { migrateUp } from '../core/database/migrator';
import { runSeeds } from '../core/database/seeds';
import { createServer } from '../core/server';
import { checkAppUpdates, checkModuleUpdates } from '../core/updater';

const PORT = Number(process.env.KATSU_PORT ?? 3123);

async function boot() {
  migrateUp();
  runSeeds();
  const { app: api } = await createServer();
  api.listen(PORT, '127.0.0.1');

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.resolve(process.cwd(), 'src', 'public', 'katsu_logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  await win.loadURL(`http://localhost:${PORT}/`);

  // Esqueleto do auto-update (app e módulos separados) — Fase 0.
  void checkAppUpdates();
  void checkModuleUpdates();
}

app.whenReady().then(boot);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
