import type { LLMProvider, ChatMessage } from '../providers/llm/llm-provider.interface.js';
import { GroqProvider } from '../providers/llm/groq.js';
import { GeminiProvider } from '../providers/llm/gemini.js';
import { OpenRouterProvider } from '../providers/llm/openrouter.js';
import { NvidiaProvider } from '../providers/llm/nvidia.js';
import { CircuitBreaker, CircuitOpenError } from '../utils/circuit-breaker.js';
import { logger } from '../utils/logger.js';

const CIRCUIT_OPTIONS = {
  failureThreshold: 2,
  resetTimeoutMs: 60_000,
};

export interface LlmHealthEntry {
  available: boolean;
  circuitState: string;
  lastError: string | null;
}

export class LlmClient {
  private readonly providers: LLMProvider[];
  private readonly circuits = new Map<string, CircuitBreaker>();
  private initialized = false;

  constructor() {
    this.providers = [
      new GroqProvider(),
      new GeminiProvider(),
      new OpenRouterProvider(),
      new NvidiaProvider(),
    ];
  }

  async init(): Promise<void> {
    const available: string[] = [];
    const unavailable: string[] = [];

    for (const p of this.providers) {
      if (p.isAvailable()) {
        available.push(p.name);
      } else {
        unavailable.push(p.name);
      }
    }

    this.initialized = true;

    if (available.length === 0) {
      logger.warn('No LLM providers configured. Set GROQ_API_KEY, GEMINI_API_KEY, OPEN_ROUTER_API_KEY, or NVIDIA_API_KEY in .env');
    } else {
      logger.info({ available, unavailable }, 'LLM providers initialized');
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    for (const p of this.providers) {
      if (!p.isAvailable()) continue;

      try {
        const circuit = this.getCircuit(p.name);
        return await circuit.call(() => p.chat(messages));
      } catch (err) {
        if (err instanceof CircuitOpenError) {
          logger.debug({ provider: p.name }, 'LLM circuit open, skipping');
        } else {
          logger.warn({ err, provider: p.name }, 'LLM provider failed, trying next');
        }
      }
    }

    return '⚠️ All AI providers unavailable. Please try again later.';
  }

  async health(): Promise<Record<string, LlmHealthEntry>> {
    const result: Record<string, LlmHealthEntry> = {};
    for (const p of this.providers) {
      const cb = this.circuits.get(p.name);
      result[p.name] = {
        available: p.isAvailable(),
        circuitState: cb?.getStats().state ?? 'CLOSED',
        lastError: cb?.getStats().lastError ?? null,
      };
    }
    return result;
  }

  private getCircuit(name: string): CircuitBreaker {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, new CircuitBreaker(name, CIRCUIT_OPTIONS));
    }
    return this.circuits.get(name)!;
  }
}
