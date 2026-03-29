import { Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Admin } from '../components/Admin';

export const AdminPage = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Toaster position="top-center" theme="dark" />
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/10 bg-black/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-16 sm:min-h-20 flex items-center justify-between py-3 sm:py-0">
          <h1 className="text-lg sm:text-xl font-light tracking-[0.25em] sm:tracking-[0.3em] uppercase truncate pr-2">
            Cyan Admin
          </h1>
          <Link
            to="/"
            className="shrink-0 min-h-11 min-w-11 inline-flex items-center justify-end text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-medium hover:text-white/60 transition-colors"
          >
            Back to site
          </Link>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-7xl px-4 pb-[max(4rem,env(safe-area-inset-bottom,0px))] pt-24 sm:px-6 sm:pb-20 sm:pt-32">
        <Admin />
      </main>
    </div>
  );
};
