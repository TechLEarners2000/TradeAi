import { Router } from 'express';
import { chat } from '../services/nvidia.js';
import { get as persistentGet } from '../services/persistent-cache.js';
import { getMockChatReply } from '../data/mock-data.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body as { messages: Array<{ role: string; content: string }> };
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing messages array' });
    }

    const lastMsg = messages[messages.length - 1]?.content || '';
    const cacheKey = `chat:${lastMsg.slice(0, 100)}`;

    const data = await persistentGet(
      cacheKey,
      async () => {
        const reply = await chat(messages);
        return { reply };
      },
      () => getMockChatReply(messages),
      { ttlMs: 60000 },
    );

    res.json(data);
  } catch (err) {
    const msg = (err as Error).message;
    logger.error({ err }, 'Chat API error');
    // Final mock fallback
    res.json(getMockChatReply(req.body?.messages || []));
  }
});

export default router;
