import type { LLMProvider, ChatMessage } from './llm-provider.interface.js';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
const TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || '30000', 10);

const SYSTEM_PROMPT = `You are TradeAI India, a stock market assistant for NSE/BSE markets.
Rules:
1. ALWAYS call the get_stock_data tool before quoting any price, change, or metric.
2. If data is unavailable, say so — never hallucinate numbers.
3. Always append: "Disclaimer: AI analysis is for educational purposes only. Not financial advice. Consult a SEBI-registered advisor before making decisions."
4. Never give direct buy/sell directives.
5. Explain financial jargon (P/E, EPS, market cap) in simple terms when asked.
6. When comparing stocks, present data in a clear table format.
7. Keep responses concise but informative.`;

export class NvidiaProvider implements LLMProvider {
  readonly name = 'nvidia';

  isAvailable(): boolean {
    return !!NVIDIA_API_KEY && NVIDIA_API_KEY !== 'your_nvidia_api_key_here';
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistralai/mixtral-8x22b-instruct-v0.1',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`NVIDIA API error ${res.status}: ${err}`);
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content ?? '';
  }
}
