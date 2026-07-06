import { LlmClient } from './llm-client.js';

const client = new LlmClient();

let initialized = false;

async function ensureInit(): Promise<void> {
  if (!initialized) {
    await client.init();
    initialized = true;
  }
}

export async function chat(messages: Array<{ role: string; content: string }>): Promise<string> {
  await ensureInit();
  return client.chat(messages);
}
