import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: 'Olá do módulo hello! O loader de módulos do Katsu funciona.' });
});

export default router;
