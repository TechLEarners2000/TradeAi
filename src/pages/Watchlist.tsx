import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBatchQuotes, StockQuote } from '../services/api';

const DEFAULT_WATCHLIST = ['RELIANCE', 'HDFCBANK', 'INFY', 'TCS'];

export default function Watchlist() {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('tradeai-watchlist');
    return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (watchlist.length > 0) {
      getBatchQuotes(watchlist).then(setQuotes).catch(() => {});
    }
  }, [watchlist]);

  const removeStock = (sym: string) => {
    const updated = watchlist.filter(s => s !== sym);
    setWatchlist(updated);
    localStorage.setItem('tradeai-watchlist', JSON.stringify(updated));
  };

  const totalPnl = quotes.reduce((sum, q) => sum + q.change, 0);
  const totalPnlPercent = quotes.length > 0
    ? (totalPnl / quotes.reduce((sum, q) => sum + q.price - q.change, 0)) * 100
    : 0;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-3 glass-panel rounded-xl p-4 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-4 -bottom-10 opacity-10">
            <span className="material-symbols-outlined text-[120px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-on-surface-variant text-body-sm uppercase tracking-wider mb-2">Watchlist Performance (24h)</h3>
            <div className="flex items-end gap-4">
              <span className={`font-display-lg ${totalPnl >= 0 ? 'text-secondary' : 'text-error'}`}>
                {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toFixed(2)}
              </span>
              <div className="flex flex-col mb-2">
                <span className={`${totalPnl >= 0 ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'} px-2 py-0.5 rounded text-[10px] font-bold flex items-center`}>
                  <span className="material-symbols-outlined text-[12px] mr-1">{totalPnl >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
                  {totalPnlPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-4 flex flex-col justify-center">
          <p className="text-on-surface-variant text-body-sm mb-1">AI Sentiment</p>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <span className="text-headline-sm font-bold">Bullish</span>
          </div>
          <div className="mt-4 w-full bg-surface-container rounded-full h-1">
            <div className="bg-secondary h-1 rounded-full" style={{ width: '78%' }} />
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h3 className="text-headline-sm">Core Watchlist</h3>
          <div className="flex gap-2">
            <button className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50 text-[11px] uppercase tracking-widest text-on-surface-variant">
                <th className="py-4 px-6 font-medium">Symbol</th>
                <th className="py-4 px-6 font-medium">LTP (₹)</th>
                <th className="py-4 px-6 font-medium">Change</th>
                <th className="py-4 px-6 font-medium">Volume</th>
                <th className="py-4 px-6 font-medium">Market Cap</th>
                <th className="py-4 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-data-md">
              {watchlist.map(sym => {
                const q = quotes.find(q => q.symbol === sym);
                return (
                  <tr key={sym} className="hover:bg-surface-container/50 transition-colors group cursor-pointer" onClick={() => navigate(`/stock/${sym}`)}>
                    <td className="py-4 px-6">
                      <div>
                        <span className="text-on-surface font-bold">{sym}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-on-surface">{q ? q.price.toLocaleString() : '---'}</td>
                    <td className={`py-4 px-6 ${q && q.changePercent >= 0 ? 'text-secondary' : 'text-error'}`}>
                      {q ? `${q.changePercent >= 0 ? '+' : ''}${q.change.toFixed(2)} (${q.changePercent.toFixed(2)}%)` : '---'}
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant">{q ? `${(q.volume / 1_000_000).toFixed(1)}M` : '---'}</td>
                    <td className="py-4 px-6 text-on-surface-variant">{q ? `${q.marketCap}T` : '---'}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all p-1"
                        onClick={e => { e.stopPropagation(); removeStock(sym); }}
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-headline-sm">Market Heatmap</h3>
            <p className="text-body-sm text-on-surface-variant">Sector-wise performance visualization</p>
          </div>
        </div>
        <div className="grid grid-cols-12 grid-rows-2 h-[400px] gap-1">
          <HeatmapCell className="col-span-4 row-span-2 bg-[#065f46]" label="Energy" stock="RELIANCE" change="+2.45%" />
          <HeatmapCell className="col-span-5 row-span-1 bg-[#991b1b]" label="Financials" stock="HDFCBANK" change="-1.20%" />
          <HeatmapCell className="col-span-3 row-span-1 bg-[#047857]" label="IT Services" stock="TCS" change="+1.15%" />
          <HeatmapCell className="col-span-3 row-span-1 bg-[#064e3b]" label="FMCG" stock="ITC" change="+0.4%" />
          <HeatmapCell className="col-span-2 row-span-1 bg-[#7f1d1d]" label="Automobile" stock="M&M" change="-1.8%" />
          <HeatmapCell className="col-span-3 row-span-1 bg-[#1e293b]" label="Mid/Small Caps" stock="Mixed" change="0.0%" />
        </div>
      </section>
    </div>
  );
}

function HeatmapCell({ className, label, stock, change }: { className: string; label: string; stock: string; change: string }) {
  return (
    <div className={`${className} treemap-node rounded p-3 flex flex-col justify-between border border-white/5 cursor-pointer`}
      style={{ transition: 'transform 0.2s ease, filter 0.2s ease' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.99)'; (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.filter = 'brightness(1)'; }}
    >
      <span className="font-bold text-xs uppercase opacity-80">{label}</span>
      <div className="flex flex-col">
        <span className="font-data-lg text-white">{stock}</span>
        <span className="text-white/60 text-[10px]">{change}</span>
      </div>
    </div>
  );
}
