export interface ChatMessage {
  role: string;
  content: string;
}

export interface LLMProvider {
  readonly name: string;
  chat(messages: ChatMessage[]): Promise<string>;
  isAvailable(): boolean;
}
