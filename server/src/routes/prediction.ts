import { Router } from 'express';
import { predict } from '../services/prediction.js';
import { get as persistentGet } from '../services/persistent-cache.js';
import { getMockPrediction } from '../data/mock-data.js';

const router = Router();

router.get('/', async (req, res) => {
  const pricesParam = req.query.prices as string;
  if (!pricesParam) return res.status(400).json({ error: 'Missing prices param (comma-separated)' });

  const prices = pricesParam.split(',').map(Number).filter(n => !isNaN(n));
  if (prices.length < 5) return res.status(400).json({ error: 'Need at least 5 price points' });

  try {
    const cacheKey = `pred:${prices.join(',')}`;
    const data = await persistentGet(
      cacheKey,
      async () => {
        const prediction = predict(prices);
        return { prediction };
      },
      () => getMockPrediction(prices),
      { ttlMs: 300000 },
    );
    res.json(data);
  } catch (err) {
    // Fallback to mock
    res.json(getMockPrediction(prices));
  }
});

export default router;
