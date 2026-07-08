import { useState, useEffect } from 'react';
import { isMockActive } from '../services/api';

export default function MockBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => setVisible(isMockActive);
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-16 left-[240px] right-0 z-40 bg-amber-500/90 dark:bg-amber-600/90 text-black text-center text-[13px] font-bold py-1.5 px-4 flex items-center justify-center gap-2">
      <span className="material-symbols-outlined text-[18px]">info</span>
      <span>Using demo / mock data — real API unavailable. Data shown is for illustration only.</span>
      <button
        className="ml-2 p-0.5 hover:bg-black/10 rounded"
        onClick={() => setVisible(false)}
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}
