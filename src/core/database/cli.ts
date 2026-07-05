import { migrateUp, migrateDown, migrationStatus } from './migrator';
import { closeDb } from './connection';

const cmd = process.argv[2];

switch (cmd) {
  case 'up': {
    const done = migrateUp();
    console.log(done.length ? `Aplicadas: ${done.join(', ')}` : 'Nada a aplicar.');
    break;
  }
  case 'down': {
    const name = migrateDown();
    console.log(name ? `Revertida: ${name}` : 'Nada a reverter.');
    break;
  }
  case 'status': {
    for (const m of migrationStatus()) {
      console.log(`${m.applied ? '[x]' : '[ ]'} ${m.name}`);
    }
    break;
  }
  default:
    console.log('Uso: cli.ts <up|down|status>');
}
closeDb();
