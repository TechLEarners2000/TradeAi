import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchStocks } from '../../services/api';

export default function TopNav() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ symbol: string; name: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  let debounceTimer: ReturnType<typeof setTimeout>;

  const handleSearch = (value: string) => {
    setQuery(value);
    clearTimeout(debounceTimer);
    if (value.length < 1) {
      setResults([]);
      return;
    }
    debounceTimer = setTimeout(async () => {
      try {
        const data = await searchStocks(value);
        setResults(data.slice(0, 5));
        setShowDropdown(true);
      } catch {
        setResults([]);
      }
    }, 300);
  };

  const selectStock = (symbol: string) => {
    setShowDropdown(false);
    setQuery('');
    navigate(`/stock/${symbol}`);
  };

  return (
    <header className="fixed top-0 left-[240px] right-0 h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-6 z-40">
      <span className="text-headline-sm font-bold text-secondary">TradeAI India</span>
      <div className="flex-1 max-w-xl mx-4 relative">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            className="w-full bg-surface-container border border-outline-variant rounded-full py-2 pl-10 pr-4 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            placeholder="Search Stocks (NSE/BSE)"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
        </div>
        {showDropdown && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-xl overflow-hidden shadow-2xl z-50">
            {results.map(r => (
              <div
                key={r.symbol}
                className="p-3 hover:bg-surface-container-high cursor-pointer border-b border-outline-variant last:border-0"
                onMouseDown={() => selectStock(r.symbol)}
              >
                <p className="font-bold text-sm">{r.symbol}</p>
                <p className="text-xs text-on-surface-variant">{r.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 text-on-surface-variant">
        <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">notifications</span></button>
        <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">account_circle</span></button>
      </div>
    </header>
  );
}
