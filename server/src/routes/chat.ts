import { Router } from 'express';
import { chat } from '../services/nvidia.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body as { messages: Array<{ role: string; content: string }> };
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing messages array' });
    }

    const reply = await chat(messages);
    res.json({ reply });
  } catch (err) {
    const msg = (err as Error).message;
    logger.error({ err }, 'Chat API error');
    res.status(502).json({ error: 'Chat service unavailable', detail: msg });
  }
});

export default router;
