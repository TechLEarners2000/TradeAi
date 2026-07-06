import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import stockRoutes from './routes/stock.js';
import chatRoutes from './routes/chat.js';
import predictionRoutes from './routes/prediction.js';
import { createHealthRouter } from './routes/health.js';
import type { ProviderChain } from './services/provider-chain.js';
import type { LlmClient } from './services/llm-client.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60_000,
  max: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Try again in 60 seconds.' },
});
app.use('/api', limiter);

let _providerChain: ProviderChain | null = null;
let _llmClient: LlmClient | null = null;

function getProviderChain(): ProviderChain | null {
  return _providerChain;
}

function getLlmClient(): LlmClient | null {
  return _llmClient;
}

app.use('/api/stock', stockRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/health', createHealthRouter(getProviderChain, getLlmClient));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`TradeAI server running on http://localhost:${PORT}`);

  const { ProviderChain } = await import('./services/provider-chain.js');
  _providerChain = new ProviderChain();
  try {
    await _providerChain.init();
    console.log('ProviderChain initialized');
  } catch (err) {
    console.warn('ProviderChain init failed (will retry on first request):', (err as Error).message);
  }

  const { LlmClient } = await import('./services/llm-client.js');
  _llmClient = new LlmClient();
  try {
    await _llmClient.init();
    console.log('LlmClient initialized');
  } catch (err) {
    console.warn('LlmClient init warning (LLM features may be limited):', (err as Error).message);
  }
});
