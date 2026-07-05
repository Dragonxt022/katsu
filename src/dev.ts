/**
 * Boot sem Electron (dev/teste): roda migrations e sobe a API local.
 * Com --smoke: sobe, testa /api/health e /api/hello, e encerra.
 */
import { migrateUp } from './core/database/migrator';
import { createServer } from './core/server';
import { closeDb } from './core/database/connection';

const PORT = Number(process.env.KATSU_PORT ?? 3123);
const smoke = process.argv.includes('--smoke');

async function main() {
  const applied = migrateUp();
  if (applied.length) console.log(`[db] migrations aplicadas: ${applied.join(', ')}`);

  const { app, modules } = await createServer();
  const server = app.listen(PORT, () => {
    console.log(`[katsu] API local em http://localhost:${PORT} — módulos: ${modules.length}`);
  });

  if (smoke) {
    const health = await fetch(`http://localhost:${PORT}/api/health`).then((r) => r.json());
    const hello = await fetch(`http://localhost:${PORT}/api/hello`).then((r) => r.json());
    console.log('[smoke] health:', JSON.stringify(health));
    console.log('[smoke] hello:', JSON.stringify(hello));
    server.close();
    closeDb();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
