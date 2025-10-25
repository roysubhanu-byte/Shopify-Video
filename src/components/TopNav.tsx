import { Link, useLocation } from 'react-router-dom';
import { Video, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { i18n } from '../lib/i18n';

interface TopNavProps {
  variant?: 'default' | 'landing';
}

export function TopNav({ variant = 'default' }: TopNavProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { credits } = useStore();
  const isAuthenticated = !!user;

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { path: '/how-it-works', label: 'How it works' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/examples', label: 'FAQ' },
  ];

  if (variant === 'landing') {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Video size={18} />
              </div>
              <span className="font-bold text-xl">{i18n.app.name}</span>
            </Link>

            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-slate-300 hover:text-white text-sm transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              <Link
                to="/signin"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Get 3 videos free
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Video size={18} />
              </div>
              <span className="font-bold text-xl">{i18n.app.name}</span>
            </Link>

            {isAuthenticated && (
              <div className="flex gap-1">
                <Link
                  to="/create"
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === '/create'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  Create
                </Link>
                <Link
                  to="/prompt"
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === '/prompt'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  Prompt
                </Link>
                <Link
                  to="/library"
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === '/library'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  Library
                </Link>
                <Link
                  to="/billing"
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === '/billing'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  Billing
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <>
                <Link
                  to="/billing"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                >
                  <span className="text-blue-400 font-bold">{credits}</span>{' '}
                  <span className="text-slate-300">{i18n.labels.credits.toLowerCase()}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </>
            )}

            {!isAuthenticated && (
              <Link
                to="/signin"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
