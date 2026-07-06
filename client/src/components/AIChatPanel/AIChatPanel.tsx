import { useState, useRef, useEffect } from 'react';
import { sendChat } from '../../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  { text: 'Analyze Q2 Results', action: 'What are the key takeaways from the latest quarterly results?' },
  { text: 'Compare with HDFC Bank', action: 'Compare this stock with HDFCBANK including valuation metrics' },
];

export default function AIChatPanel({ symbol }: { symbol: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const msgs = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await sendChat(msgs);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error('Chat API error:', detail);
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${detail}` }]);
    }
    setLoading(false);
  };

  return (
    <aside className="w-[320px] h-full glass-panel border-l border-outline-variant flex flex-col shadow-2xl">
      <div className="p-6 border-b border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 ai-gradient-bg rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">smart_toy</span>
          </div>
          <span className="text-headline-sm">AI Assistant</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <>
            <div className="flex justify-end">
              <div className="bg-primary-container text-on-primary-container p-3 rounded-2xl rounded-tr-none max-w-[90%] text-body-sm">
                How is {symbol} performing today?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 ai-gradient-bg rounded-md flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[14px]">bolt</span>
                </div>
                <span className="text-data-sm text-secondary font-bold">INSIGHT</span>
              </div>
              <div className="bg-surface-container-high border-l-4 border-indigo-500 p-3 rounded-2xl rounded-tl-none max-w-[95%] text-body-sm space-y-2">
                <p>Ask me anything about <strong>{symbol}</strong> — price, fundamentals, comparisons, or explain financial terms.</p>
              </div>
            </div>
          </>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 ai-gradient-bg rounded-md flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[14px]">bolt</span>
                </div>
                <span className="text-data-sm text-secondary font-bold">INSIGHT</span>
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[90%] text-body-sm ${
                msg.role === 'user'
                  ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                  : 'bg-surface-container-high border-l-4 border-indigo-500 rounded-tl-none'
              }`}
            >
              {msg.content.split('\n').map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-on-surface-variant text-sm">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            Analyzing...
          </div>
        )}

        {messages.length === 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-data-sm text-on-surface-variant px-1 uppercase tracking-wider">Suggested Actions</p>
            {suggestions.map(s => (
              <button
                key={s.text}
                className="flex items-center justify-between w-full p-3 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container-high transition-all group"
                onClick={() => handleSend(s.action)}
              >
                <span className="text-body-sm">{s.text}</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-6 border-t border-outline-variant">
        <div className="relative">
          <textarea
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-4 pr-12 py-3 text-body-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            placeholder={`Ask AI about ${symbol}...`}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(input))}
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 ai-gradient-bg rounded-lg flex items-center justify-center text-white hover:opacity-80 transition-opacity disabled:opacity-40"
            onClick={() => handleSend(input)}
            disabled={loading || !input.trim()}
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
