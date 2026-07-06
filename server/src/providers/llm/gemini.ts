import type { LLMProvider, ChatMessage } from './llm-provider.interface.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
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

interface GeminiContent {
  role: string;
  parts: Array<{ text: string }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: unknown;
}

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';

  isAvailable(): boolean {
    return !!GEMINI_API_KEY;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const contents = this.toGeminiContents(messages);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json() as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini: empty response');
    }
    return text;
  }

  private toGeminiContents(messages: ChatMessage[]): GeminiContent[] {
    return messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
  }
}
