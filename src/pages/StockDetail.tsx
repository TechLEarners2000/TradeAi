import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getQuote, getPrediction, StockQuote, PredictionPoint } from '../services/api';
import StockChart from '../components/StockChart/StockChart';
import AIChatPanel from '../components/AIChatPanel/AIChatPanel';

const FAKE_HISTORICAL = [2850, 2880, 2860, 2910, 2890, 2920, 2950];

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [prediction, setPrediction] = useState<PredictionPoint[]>([]);
  const [exchange, setExchange] = useState<'NSE' | 'BSE'>('NSE');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!symbol) return;
    setError('');
    getQuote(symbol).then(setQuote).catch(() => {
      setQuote(null);
      setError('Stock data temporarily unavailable. Showing mock data.');
    });
    getPrediction(FAKE_HISTORICAL).then(r => setPrediction(r.prediction)).catch(() => {});
  }, [symbol]);

  const q = quote || {
    symbol: symbol || 'RELIANCE',
    price: 2950.45,
    change: 34.85,
    changePercent: 1.20,
    dayRange: { low: 2910, high: 2965.20 },
    week52Range: { low: 2200, high: 3025 },
    volume: 8200000,
    marketCap: 19.5,
    pe: 28.4,
    dividendYield: 0.34,
    eps: 104.2,
    sector: 'Energy',
    industry: 'Refineries',
    name: `${symbol || 'RELIANCE'} INDUSTRIES LTD`,
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-6 space-y-6">
        {error && (
          <div className="bg-error-container/20 border border-error/30 text-error rounded-lg p-3 text-body-sm">
            {error}
          </div>
        )}

        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-headline-md text-on-surface">{q.name}</h2>
              <span className="text-on-surface-variant font-data-md">{q.symbol}.{exchange === 'NSE' ? 'NS' : 'BO'}</span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-display-lg text-on-surface">₹{q.price.toLocaleString()}</span>
              <span className={`font-data-lg ${q.changePercent >= 0 ? 'text-secondary' : 'text-error'}`}>
                {q.changePercent >= 0 ? '+' : ''}₹{q.change.toFixed(2)} ({q.changePercent.toFixed(2)}%)
              </span>
              <span className="text-on-surface-variant text-body-sm italic">Market Open &bull; As of today</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-surface-container rounded-full p-1 flex">
              <button
                className={`px-4 py-1.5 rounded-full text-body-sm font-bold transition-all ${
                  exchange === 'NSE' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-primary'
                }`}
                onClick={() => setExchange('NSE')}
              >
                NSE
              </button>
              <button
                className={`px-4 py-1.5 rounded-full text-body-sm font-bold transition-all ${
                  exchange === 'BSE' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-primary'
                }`}
                onClick={() => setExchange('BSE')}
              >
                BSE
              </button>
            </div>
            <div className="flex gap-6 text-body-sm">
              <div className="text-right">
                <p className="text-on-surface-variant">Day Range</p>
                <p className="font-data-md">₹{q.dayRange.low.toLocaleString()} - ₹{q.dayRange.high.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-on-surface-variant">52W Range</p>
                <p className="font-data-md">₹{q.week52Range.low.toLocaleString()} - ₹{q.week52Range.high.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

        <StockChart historical={FAKE_HISTORICAL} prediction={prediction} symbol={q.symbol} />

        <section>
          <h3 className="text-headline-sm mb-4">Key Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Market Cap" value={`₹${q.marketCap}T`} />
            <MetricCard label="P/E Ratio" value={q.pe.toFixed(1)} sub={`Sector Avg: 22.1`} subColor="text-error" tooltip="Price-to-Earnings ratio measures share price relative to EPS." />
            <MetricCard label="Dividend Yield" value={`${q.dividendYield}%`} sub={`Annual: ₹10.00`} />
            <MetricCard label="EPS (TTM)" value={q.eps.toFixed(1)} sub="+8.4% YoY" subColor="text-secondary" tooltip="Earnings Per Share is net profit divided by outstanding shares." />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container rounded-xl border border-outline-variant p-4">
            <h3 className="text-headline-sm mb-4">Recent News</h3>
            <div className="space-y-4">
              {[
                { title: 'Reliance expands green hydrogen capacity by 20% in Gujarat.', source: 'LiveMint', time: '2 hours ago' },
                { title: 'Reliance Retail to acquire premium European fashion brands.', source: 'Economic Times', time: '5 hours ago' },
              ].map((news, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-20 h-20 bg-surface-container-highest rounded-lg flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-body-md">{news.title}</h4>
                    <p className="text-body-sm text-on-surface-variant mt-1">{news.time} &bull; {news.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-container rounded-xl border border-outline-variant p-4 flex flex-col">
            <h3 className="text-headline-sm mb-4">Analyst Ratings</h3>
            <div className="flex-1 flex flex-col justify-center gap-6">
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" fill="transparent" r="40" stroke="#353436" strokeWidth="8" />
                    <circle cx="48" cy="48" fill="transparent" r="40" stroke="#4edea3" strokeDasharray="251.2" strokeDashoffset="62.8" strokeWidth="8" />
                  </svg>
                  <span className="absolute text-headline-sm font-bold">75%</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="flex justify-between text-body-sm"><span>Buy</span><span className="text-secondary">75%</span></div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full"><div className="bg-secondary h-full" style={{ width: '75%' }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-body-sm"><span>Hold</span><span className="text-on-surface-variant">20%</span></div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full"><div className="bg-outline h-full" style={{ width: '20%' }} /></div>
                  </div>
                </div>
              </div>
              <p className="text-body-sm text-on-surface-variant italic">Based on 45 analyst recommendations in the last 30 days.</p>
            </div>
          </div>
        </section>
      </div>

      {symbol && <AIChatPanel symbol={symbol} />}
    </div>
  );
}

function MetricCard({ label, value, sub, subColor, tooltip }: {
  label: string; value: string; sub?: string; subColor?: string; tooltip?: string;
}) {
  return (
    <div className="bg-surface-container-high border border-outline-variant p-4 rounded-xl hover:bg-surface-variant transition-colors group relative">
      <div className="flex items-center gap-1 text-on-surface-variant text-body-sm">
        {label}
        {tooltip && (
          <div className="relative group/tip">
            <span className="material-symbols-outlined text-[16px] cursor-help">info</span>
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 glass-panel rounded-lg shadow-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-200 z-50 text-body-sm">
              <p className="font-bold text-secondary mb-1">{label}</p>
              <p>{tooltip}</p>
            </div>
          </div>
        )}
      </div>
      <p className="text-headline-sm mt-1">{value}</p>
      {sub && <p className={`text-data-sm mt-2 ${subColor || 'text-on-surface-variant'}`}>{sub}</p>}
    </div>
  );
}
