import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Layout() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <Sidebar />
      <TopNav />
      <main className="ml-[240px] pt-16 h-full overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
        <footer className="bg-surface-container-lowest py-4 px-6 border-t border-outline-variant">
          <div className="flex items-center justify-between">
            <p className="text-body-sm text-on-surface-variant italic">
              Educational use only — not financial advice. Past performance is not indicative of future results.
            </p>
            <div className="flex gap-4">
              <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Risk Disclosure</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
