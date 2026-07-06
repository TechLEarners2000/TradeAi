import { useState } from 'react';

const faqs = [
  { q: 'What data does TradeAI use?', a: 'TradeAI pulls live NSE/BSE data from the Indian Stock Market API (0xramm/Indian-Stock-Market-API). Historical data is sourced via Yahoo Finance. AI responses are powered by NVIDIA NIM.' },
  { q: 'Are the predictions financial advice?', a: 'No. All predictions are statistical projections (linear regression on historical prices) and are clearly labeled "not advice." Always consult a SEBI-registered advisor before making investment decisions.' },
  { q: 'How often is data refreshed?', a: 'Stock quotes are cached for 30 seconds and polled on page interaction. The upstream API is rate-limited to 60 requests per minute, shared across all users.' },
  { q: 'Can I track multiple stocks?', a: 'Yes. Use the Watchlist page to add/remove stocks. Your watchlist is saved in your browser (localStorage) and persists between sessions.' },
  { q: 'Why do sector indices show "Demo"?', a: 'The free stock API does not provide Nifty/Sensex index values. These sector cards show illustrative demo data and will be replaced when an index data source is integrated.' },
  { q: 'Which exchanges are supported?', a: 'TradeAI supports both NSE (National Stock Exchange) and BSE (Bombay Stock Exchange). Data is fetched from NSE by default with automatic fallback to BSE.' },
  { q: 'Is there a mobile app?', a: 'Not yet. TradeAI is currently a web application optimized for desktop browsers. Mobile responsiveness is on the roadmap.' },
  { q: 'How do I report a bug?', a: 'Please open an issue on our GitHub repository with a description of the bug, steps to reproduce, and any relevant screenshots.' },
];

export default function FAQs() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-6 max-w-3xl">
      <section className="border-b border-outline-variant pb-4">
        <h2 className="text-headline-md font-bold text-on-surface">Frequently Asked Questions</h2>
        <p className="text-body-sm text-on-surface-variant mt-1">Everything you need to know about TradeAI</p>
      </section>

      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="glass-panel rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-5 text-left text-body-md font-medium hover:bg-surface-container-high transition-colors"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <span>{faq.q}</span>
              <span className={`material-symbols-outlined transition-transform ${expanded === i ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            {expanded === i && (
              <div className="px-5 pb-5 text-body-sm text-on-surface-variant leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-xl p-6 text-center">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">chat</span>
        <p className="text-body-sm text-on-surface-variant">
          Still have questions? Ask{' '}
          <a href="/assistant" className="text-primary hover:underline font-bold">TradeAI Assistant</a>
        </p>
      </div>
    </div>
  );
}
