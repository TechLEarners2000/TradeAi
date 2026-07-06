import { Router } from 'express';
import { predict } from '../services/prediction.js';

const router = Router();

router.get('/', (req, res) => {
  const pricesParam = req.query.prices as string;
  if (!pricesParam) return res.status(400).json({ error: 'Missing prices param (comma-separated)' });

  const prices = pricesParam.split(',').map(Number).filter(n => !isNaN(n));
  if (prices.length < 5) return res.status(400).json({ error: 'Need at least 5 price points' });

  const result = predict(prices);
  res.json({ prediction: result });
});

export default router;
