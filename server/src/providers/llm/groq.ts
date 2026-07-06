import type { LLMProvider, ChatMessage } from './llm-provider.interface.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
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

export class GroqProvider implements LLMProvider {
  readonly name = 'groq';

  isAvailable(): boolean {
    return !!GROQ_API_KEY;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
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
      throw new Error(`Groq API error ${res.status}: ${err}`);
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content ?? '';
  }
}
