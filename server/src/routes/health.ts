import { Router } from 'express';
import type { ProviderChain } from '../services/provider-chain.js';
import type { LlmClient } from '../services/llm-client.js';
import * as cache from '../services/cache.js';

export function createHealthRouter(
  getProviderChain: () => ProviderChain | null,
  getLlmClient: () => LlmClient | null,
): Router {
  const router = Router();

  router.get('/providers', (_req, res) => {
    const chain = getProviderChain();
    if (!chain) {
      return res.json({ providers: null, cache: cache.stats() });
    }
    res.json({
      providers: chain.getCircuitStats(),
      cache: cache.stats(),
    });
  });

  router.get('/llm', async (_req, res) => {
    const client = getLlmClient();
    if (!client) {
      return res.json({ llm: null });
    }
    try {
      const health = await client.health();
      res.json({ llm: health });
    } catch (err) {
      res.json({ llm: null, error: (err as Error).message });
    }
  });

  return router;
}
