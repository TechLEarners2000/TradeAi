import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStockList, getBatchQuotes, StockQuote } from '../services/api';

export default function AllStocks() {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [stockList, setStockList] = useState<Array<{ symbol: string; name: string }>>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getStockList()
      .then(list => {
        setStockList(list);
        const syms = list.slice(0, 50).map(s => s.symbol);
        setQuotesLoading(true);
        return getBatchQuotes(syms);
      })
      .then(q => setQuotes(q))
      .catch(() => {})
      .finally(() => { setLoading(false); setQuotesLoading(false); });
  }, []);

  const filtered = stockList.filter(s =>
    s.symbol.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const displayList = search ? filtered : stockList.slice(0, 50);

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between border-b border-outline-variant pb-4">
        <div>
          <h2 className="text-headline-md font-bold text-on-surface">All Stocks</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Browse NSE listed securities</p>
        </div>
      </section>

      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input
          className="w-full bg-surface-container border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          placeholder="Search by symbol or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-body-sm text-on-surface-variant">Loading stocks...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="p-4 text-body-sm text-on-surface-variant font-medium">Symbol</th>
                <th className="p-4 text-body-sm text-on-surface-variant font-medium">Name</th>
                <th className="p-4 text-body-sm text-on-surface-variant font-medium text-right">LTP (₹)</th>
                <th className="p-4 text-body-sm text-on-surface-variant font-medium text-right">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {displayList.map(s => {
                const q = quotes.find(q => q.symbol === s.symbol);
                return (
                  <tr
                    key={s.symbol}
                    className="hover:bg-surface-container-high transition-colors cursor-pointer"
                    onClick={() => navigate(`/stock/${s.symbol}`)}
                  >
                    <td className="p-4 font-data-md font-bold text-on-surface">{s.symbol}</td>
                    <td className="p-4 text-body-sm text-on-surface-variant">{s.name}</td>
                    <td className="p-4 text-right font-data-md">
                      {quotesLoading ? (
                        <span className="text-on-surface-variant">...</span>
                      ) : q ? (
                        `₹${q.price.toLocaleString()}`
                      ) : (
                        <span className="text-on-surface-variant text-body-sm">unavailable</span>
                      )}
                    </td>
                    <td className={`p-4 text-right font-data-md ${
                      q ? (q.changePercent >= 0 ? 'text-secondary' : 'text-error') : ''
                    }`}>
                      {quotesLoading ? (
                        <span className="text-on-surface-variant">...</span>
                      ) : q ? (
                        `${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%`
                      ) : (
                        <span className="text-on-surface-variant text-body-sm">---</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && search && filtered.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-body-sm text-on-surface-variant">No stocks found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && stockList.length > 50 && !search && (
        <p className="text-body-sm text-on-surface-variant text-center">
          Showing 50 of {stockList.length} stocks. Use search to find more.
        </p>
      )}
    </div>
  );
}
