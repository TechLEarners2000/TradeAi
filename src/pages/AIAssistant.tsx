import { useState, useRef, useEffect } from 'react';
import { sendChat } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const examples = [
  { text: 'Compare TCS vs INFY valuation', desc: 'Performance & Ratios', full: 'Compare TCS vs Infosys. Include valuation metrics, 1-year performance, and current analyst sentiment.' },
  { text: 'Explain the recent drop in Nifty Bank', desc: 'Market Sentiment', full: 'Explain the recent drop in Nifty Bank index. What are the key factors?' },
  { text: 'What are the top 3 dividend paying stocks?', desc: 'Passive Income Focus', full: 'What are the top 3 dividend paying stocks on NSE right now?' },
];

export default function AIAssistant() {
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
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-4">
        {messages.length === 0 && (
          <>
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-white">bolt</span>
              </div>
              <div>
                <h2 className="text-headline-md">Your Intelligence Terminal</h2>
                <p className="text-on-surface-variant max-w-md mx-auto">Real-time NSE/BSE data analyzed by professional-grade AI for precise decision making.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-10">
              {examples.map(ex => (
                <button
                  key={ex.text}
                  className="glass-panel p-4 rounded-xl text-left hover:border-secondary transition-all group"
                  onClick={() => handleSend(ex.full)}
                >
                  <p className="text-body-sm font-medium text-on-surface group-hover:text-secondary">{ex.text}</p>
                  <span className="text-[12px] text-outline mt-2 block">{ex.desc}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            {msg.role === 'assistant' ? (
              <div className="max-w-[90%] glass-panel px-6 py-6 rounded-2xl rounded-tl-none border-l-4 border-l-secondary ai-glow">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <span className="font-bold text-secondary uppercase tracking-widest text-[12px]">AI Analysis</span>
                </div>
                <div className="text-body-md leading-relaxed whitespace-pre-wrap">{msg.content}</div>
              </div>
            ) : (
              <div className="max-w-[80%] bg-primary-container text-on-primary-container px-6 py-4 rounded-2xl rounded-tr-none border border-outline-variant/30">
                <p className="font-body-md">{msg.content}</p>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-on-surface-variant text-sm ml-4">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            Analyzing with TradeAI...
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="pb-6 pt-2 bg-background">
        <div className="glass-panel rounded-2xl p-2 transition-all">
          <textarea
            className="w-full bg-transparent border-none focus:ring-0 text-body-md text-on-surface px-4 py-2 resize-none custom-scrollbar"
            placeholder="Ask about stocks, trends, or portfolio strategy..."
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(input))}
          />
          <div className="flex justify-between items-center px-2 py-1">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-outline">NSE API Connection: Active</span>
            </div>
            <button
              className="bg-secondary text-on-secondary px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
            >
              <span>Analyze</span>
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
        <footer className="mt-4 text-center">
          <p className="text-[11px] text-outline">Data Source: NSE API via TradeAI Proxy | Educational use only — not financial advice</p>
        </footer>
      </div>
    </div>
  );
}
