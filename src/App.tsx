import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import MarketOverview from './pages/MarketOverview';
import StockDetail from './pages/StockDetail';
import Watchlist from './pages/Watchlist';
import AIAssistant from './pages/AIAssistant';
import AllStocks from './pages/AllStocks';
import FAQs from './pages/FAQs';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MarketOverview />} />
        <Route path="/stock/:symbol" element={<StockDetail />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/assistant" element={<AIAssistant />} />
        <Route path="/stocks" element={<AllStocks />} />
        <Route path="/faqs" element={<FAQs />} />
      </Route>
    </Routes>
  );
}
