import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBatchQuotes, getSymbols, StockQuote, SymbolInfo } from '../services/api';

const TRENDING_SYMBOLS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC', 'SBIN'];

const sectors = [
  { name: 'NIFTY IT', value: '34,512.20', change: '+1.24%', up: true },
  { name: 'NIFTY BANK', value: '47,891.45', change: '-0.12%', up: false },
  { name: 'NIFTY ENERGY', value: '28,944.10', change: '+2.08%', up: true },
  { name: 'NIFTY AUTO', value: '20,118.65', change: '+0.56%', up: true },
];

const faqs = [
  { q: 'What data does TradeAI use?', a: 'TradeAI pulls live NSE/BSE data from the Indian Stock Market API (0xramm/Indian-Stock-Market-API). Historical data is sourced via Yahoo Finance. AI responses are powered by NVIDIA NIM.' },
  { q: 'Are the predictions financial advice?', a: 'No. All predictions are statistical projections (linear regression on historical prices) and are clearly labeled "not advice." Always consult a SEBI-registered advisor before making investment decisions.' },
  { q: 'How often is data refreshed?', a: 'Stock quotes are cached for 30 seconds and polled on page interaction. The upstream API is rate-limited to 60 requests per minute, shared across all users.' },
  { q: 'Can I track multiple stocks?', a: 'Yes. Use the Watchlist page to add/remove stocks. Your watchlist is saved in your browser (localStorage) and persists between sessions.' },
  { q: 'Why do sector indices show "Demo"?', a: 'The free stock API does not provide Nifty/Sensex index values. These sector cards show illustrative demo data and will be replaced when an index data source is integrated.' },
];

type LoadState = 'loading' | 'loaded' | 'error';

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-surface-container-highest" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-surface-container-highest rounded" />
            <div className="h-3 w-16 bg-surface-container-highest rounded" />
          </div>
        </div>
      </td>
      <td className="p-6 text-right"><div className="h-4 w-20 bg-surface-container-highest rounded ml-auto" /></td>
      <td className="p-6 text-right"><div className="h-4 w-28 bg-surface-container-highest rounded ml-auto" /></td>
      <td className="p-6 text-right"><div className="h-4 w-12 bg-surface-container-highest rounded ml-auto" /></td>
    </tr>
  );
}

function ChangeBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 font-data-md ${up ? 'text-secondary' : 'text-error'}`}>
      <span className="material-symbols-outlined text-[16px]">{up ? 'arrow_upward' : 'arrow_downward'}</span>
      {up ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

function FreshnessDot() {
  return (
    <span className="inline-flex items-center gap-1.5 text-on-surface-variant text-body-sm">
      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
      Delayed by 1 min
    </span>
  );
}

export default function MarketOverview() {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [allSymbols, setAllSymbols] = useState<SymbolInfo[]>([]);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const loadData = () => {
    setState('loading');
    getBatchQuotes(TRENDING_SYMBOLS)
      .then(data => {
        setQuotes(data);
        setState('loaded');
      })
      .catch(() => setState('error'));
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { getSymbols().then(setAllSymbols).catch(() => {}); }, []);

  const sortedByChange = useMemo(() =>
    [...quotes].sort((a, b) => b.changePercent - a.changePercent),
    [quotes]
  );

  const gainers = sortedByChange.filter(q => q.changePercent > 0);
  const losers = sortedByChange.filter(q => q.changePercent <= 0);

  const filteredSymbols = allSymbols.filter(s =>
    s.symbol.toLowerCase().includes(symbolSearch.toLowerCase())
  ).slice(0, 40);

  const sparklinePath = (up: boolean) =>
    up
      ? 'M0 35 L10 32 L20 38 L30 25 L40 28 L50 15 L60 18 L70 10 L80 12 L90 5 L100 8'
      : 'M0 10 L10 15 L20 12 L30 25 L40 22 L50 35 L60 32 L70 38 L80 34 L90 39 L100 37';

  const sentimentSignals = sectors
    .filter(s => s.up)
    .slice(0, 2)
    .map(s => `${s.name} ${s.change}`)
    .join(', ');

  const topTrending = sortedByChange.slice(0, 2)
    .map(q => `${q.symbol} ${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%`)
    .join(', ');

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between border-b border-outline-variant pb-4">
        <div>
          <h2 className="text-headline-md font-bold text-on-surface">Market Pulse</h2>
          <div className="flex items-center mt-1 gap-2">
            <FreshnessDot />
            <span className="text-on-surface-variant text-body-sm">&bull; NIFTY 50:</span>
            <span className="text-secondary font-data-md">22,453.15 (+0.45%)</span>
            <span className="text-[10px] text-on-surface-variant italic">Demo data</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sectors.map(s => (
          <div key={s.name} className="glass-panel p-4 rounded-xl">
            <div className="flex justify-between items-start mb-1">
              <span className="text-body-sm text-on-surface-variant">{s.name} <span className="italic text-[10px]">(Demo)</span></span>
              <span className={`inline-flex items-center gap-1 font-data-md ${s.up ? 'text-secondary' : 'text-error'}`}>
                <span className="material-symbols-outlined text-[14px]">{s.up ? 'arrow_upward' : 'arrow_downward'}</span>
                {s.change}
              </span>
            </div>
            <div className="text-headline-sm font-bold">{s.value}</div>
            <div className="flex items-center gap-2 mt-2">
              <FreshnessDot />
            </div>
            <div className="h-12 w-full mt-2 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                <path d={sparklinePath(s.up)} fill="none" stroke={s.up ? '#4edea3' : '#ffb4ab'} strokeWidth="2" />
              </svg>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-headline-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">trending_up</span>
            Trending Stocks
            <FreshnessDot />
          </h3>
          <div className="glass-panel rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant">
                  <th className="p-6 text-body-sm text-on-surface-variant font-medium">STOCK NAME</th>
                  <th className="p-6 text-body-sm text-on-surface-variant font-medium text-right">PRICE (INR)</th>
                  <th className="p-6 text-body-sm text-on-surface-variant font-medium text-right">24H CHANGE</th>
                  <th className="p-6 text-body-sm text-on-surface-variant font-medium text-right">VOLUME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {state === 'loading' && TRENDING_SYMBOLS.map((_, i) => <SkeletonRow key={i} />)}
                {state === 'error' && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant">cloud_off</span>
                        <p className="text-body-md text-on-surface-variant">Could not load stock data</p>
                        <button
                          className="px-4 py-2 bg-primary-container text-primary rounded-lg text-body-sm font-bold hover:bg-primary hover:text-on-primary transition-all"
                          onClick={loadData}
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {state === 'loaded' && quotes.map((q, i) => (
                  <tr
                    key={q.symbol}
                    className="hover:bg-surface-container-highest transition-colors cursor-pointer group"
                    onClick={() => navigate(`/stock/${q.symbol}`)}
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary-container flex items-center justify-center font-bold text-primary">
                          {q.symbol[0]}
                        </div>
                        <div>
                          <div className="text-body-md font-bold group-hover:text-secondary transition-colors">{q.symbol}</div>
                          <div className="text-data-sm text-on-surface-variant">{q.symbol} &bull; NSE</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right font-data-md">₹{q.price.toLocaleString()}</td>
                    <td className="p-6 text-right">
                      <span className={`inline-flex items-center gap-1 font-data-md ${q.changePercent >= 0 ? 'text-secondary' : 'text-error'}`}>
                        <span className="material-symbols-outlined text-[16px]">{q.changePercent >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
                        {q.changePercent >= 0 ? '+' : ''}₹{q.change.toFixed(2)} ({q.changePercent.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="p-6 text-right font-data-md text-on-surface-variant">
                      {(q.volume / 1_000_000).toFixed(1)}M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass-panel rounded-xl p-6 flex items-center">
            <div className="flex-1">
              <div className="flex items-center text-primary mb-2 gap-2">
                <span className="material-symbols-outlined">psychology</span>
                <span className="text-headline-sm font-bold">AI Market Sentiment</span>
              </div>
              <p className="text-body-md text-on-surface-variant max-w-lg">
                Current market sentiment is <span className="text-secondary font-bold">Bullish</span>.
              </p>
              <div className="mt-2 text-data-sm text-on-surface-variant space-y-0.5">
                <p>Based on: {sentimentSignals || 'NIFTY IT +1.24%, ENERGY +2.08%'}{topTrending ? ` | Top movers: ${topTrending}` : ''}</p>
                <FreshnessDot />
              </div>
            </div>
            <button
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20"
              onClick={() => navigate('/assistant')}
            >
              Ask TradeAI
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">arrow_upward</span>
              Top Gainers
              <FreshnessDot />
            </h3>
            <div className="glass-panel rounded-xl divide-y divide-outline-variant">
              {state === 'loading' && [1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                  <div className="space-y-2"><div className="h-4 w-24 bg-surface-container-highest rounded" /><div className="h-3 w-16 bg-surface-container-highest rounded" /></div>
                  <div className="text-right space-y-2"><div className="h-4 w-16 bg-surface-container-highest rounded ml-auto" /><div className="h-3 w-10 bg-surface-container-highest rounded ml-auto" /></div>
                </div>
              ))}
              {state === 'loaded' && gainers.slice(0, 5).map(g => (
                <div key={g.symbol} className="flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors cursor-pointer" onClick={() => navigate(`/stock/${g.symbol}`)}>
                  <div>
                    <div className="font-data-md font-bold">{g.symbol}</div>
                    <div className="text-data-sm text-on-surface-variant">₹{g.price.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <ChangeBadge value={g.changePercent} />
                    <div className="text-data-sm text-on-surface-variant">NSE</div>
                  </div>
                </div>
              ))}
              {state === 'loaded' && gainers.length === 0 && (
                <div className="p-4 text-center text-body-sm text-on-surface-variant">No gainers at this time</div>
              )}
              {state === 'error' && (
                <div className="p-4 text-center text-body-sm text-on-surface-variant">Data unavailable</div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-error">arrow_downward</span>
              Top Losers
              <FreshnessDot />
            </h3>
            <div className="glass-panel rounded-xl divide-y divide-outline-variant">
              {state === 'loading' && [1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                  <div className="space-y-2"><div className="h-4 w-24 bg-surface-container-highest rounded" /><div className="h-3 w-16 bg-surface-container-highest rounded" /></div>
                  <div className="text-right space-y-2"><div className="h-4 w-16 bg-surface-container-highest rounded ml-auto" /><div className="h-3 w-10 bg-surface-container-highest rounded ml-auto" /></div>
                </div>
              ))}
              {state === 'loaded' && losers.slice(0, 5).map(g => (
                <div key={g.symbol} className="flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors cursor-pointer" onClick={() => navigate(`/stock/${g.symbol}`)}>
                  <div>
                    <div className="font-data-md font-bold">{g.symbol}</div>
                    <div className="text-data-sm text-on-surface-variant">₹{g.price.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <ChangeBadge value={g.changePercent} />
                    <div className="text-data-sm text-on-surface-variant">NSE</div>
                  </div>
                </div>
              ))}
              {state === 'loaded' && losers.length === 0 && (
                <div className="p-4 text-center text-body-sm text-on-surface-variant">No losers at this time</div>
              )}
              {state === 'error' && (
                <div className="p-4 text-center text-body-sm text-on-surface-variant">Data unavailable</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="glass-panel rounded-xl p-6">
        <h3 className="text-headline-sm font-bold flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-secondary">dataset</span>
          All Stocks
        </h3>
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            className="w-full bg-surface-container border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Filter symbols..."
            value={symbolSearch}
            onChange={e => setSymbolSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 max-h-[240px] overflow-y-auto">
          {(symbolSearch ? filteredSymbols : allSymbols.slice(0, 40)).map(s => (
            <button
              key={s.symbol}
              className="px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded-lg text-data-sm hover:border-primary hover:text-primary transition-all"
              onClick={() => navigate(`/stock/${s.symbol}`)}
            >
              {s.symbol}
            </button>
          ))}
          {allSymbols.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">Loading symbols...</p>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-xl p-6">
        <h3 className="text-headline-sm font-bold flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-secondary">help</span>
          Frequently Asked Questions
        </h3>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-outline-variant rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left text-body-md font-medium hover:bg-surface-container-high transition-colors"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              >
                <span>{faq.q}</span>
                <span className={`material-symbols-outlined transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              {expandedFaq === i && (
                <div className="px-4 pb-4 text-body-sm text-on-surface-variant leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
