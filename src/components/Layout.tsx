import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import type { Lang, Translations } from '../i18n';
import { useAuth } from '../auth/AuthContext';

interface LayoutProps {
  children: ReactNode;
  lang: Lang;
  setLang: (lang: Lang) => void;
  tr: Translations;
}

export function Layout({ children, lang, setLang, tr }: LayoutProps) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b border-slate-200/60 ${isHome ? 'bg-white/80' : 'bg-white/95'}`}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary no-underline">
            <svg width="28" height="28" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="logo-g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#2563eb' }} />
                  <stop offset="100%" style={{ stopColor: '#7c3aed' }} />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="url(#logo-g)" />
              <path d="M35 55 L45 65 L65 40" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            CareerLens
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/" className="text-slate-600 hover:text-primary no-underline">{tr.nav.home}</Link>
            <Link to="/start" className="bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-dark no-underline text-sm font-medium">
              {tr.nav.start}
            </Link>
            <button
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              className="flex items-center gap-1 text-slate-500 hover:text-primary bg-transparent border-none cursor-pointer text-sm"
            >
              <Globe size={16} />
              {lang === 'ko' ? 'EN' : '한국어'}
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/mypage"
                  className="flex items-center gap-1 text-slate-600 hover:text-primary no-underline text-sm"
                >
                  <User size={14} />
                  {user.email?.split('@')[0]}
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1 text-slate-500 hover:text-red-500 bg-transparent border-none cursor-pointer text-sm"
                >
                  <LogOut size={14} />
                  {tr.auth.logout}
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-slate-600 hover:text-primary no-underline text-sm">
                {tr.auth.login}
              </Link>
            )}
          </nav>

          <button
            className="md:hidden bg-transparent border-none cursor-pointer text-slate-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-3">
            <Link to="/" className="text-slate-600 no-underline py-1" onClick={() => setMenuOpen(false)}>{tr.nav.home}</Link>
            <Link to="/start" className="text-primary font-medium no-underline py-1" onClick={() => setMenuOpen(false)}>{tr.nav.start}</Link>
            <button
              onClick={() => { setLang(lang === 'ko' ? 'en' : 'ko'); setMenuOpen(false); }}
              className="flex items-center gap-1 text-slate-500 bg-transparent border-none cursor-pointer text-sm py-1"
            >
              <Globe size={16} />
              {lang === 'ko' ? 'English' : '한국어'}
            </button>
            {user ? (
              <>
                <Link
                  to="/mypage"
                  className="flex items-center gap-1 text-slate-600 no-underline py-1 text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={16} />
                  {tr.auth.mypage}
                </Link>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="flex items-center gap-1 text-slate-500 bg-transparent border-none cursor-pointer text-sm py-1"
                >
                  <LogOut size={16} />
                  {tr.auth.logout}
                </button>
              </>
            ) : (
              <Link to="/login" className="text-slate-600 no-underline py-1" onClick={() => setMenuOpen(false)}>
                {tr.auth.login}
              </Link>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-slate-900 text-slate-400 text-xs py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="font-medium text-slate-300">CareerLens</span>
            <div className="flex gap-4">
              <Link to="/terms" className="text-slate-400 hover:text-slate-200 no-underline">{tr.footer.terms}</Link>
              <Link to="/privacy" className="text-slate-400 hover:text-slate-200 no-underline">{tr.footer.privacy}</Link>
              <Link to="/refund" className="text-slate-400 hover:text-slate-200 no-underline">{tr.footer.refund}</Link>
            </div>
          </div>
          <p className="text-center mt-4 text-slate-500">{tr.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
