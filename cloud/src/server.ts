import express from 'express';
import syncRoutes from './routes/sync';
import licenseRoutes from './routes/license';

const PORT = Number(process.env.CLOUD_PORT ?? 4000);

export function createCloudServer() {
  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'katsu-cloud' }));
  app.use('/api/sync', syncRoutes);
  app.use('/api/license', licenseRoutes);
  return app;
}

if (require.main === module) {
  const app = createCloudServer();
  app.listen(PORT, () => console.log(`[katsu-cloud] ouvindo em http://localhost:${PORT}`));
}
