import { Link, useLocation } from 'react-router-dom';
import { Video, CreditCard } from 'lucide-react';
import { useStore } from '../store/useStore';

export function TopNav() {
  const location = useLocation();
  const credits = useStore((state) => state.credits);

  const navItems = [
    { path: '/', label: 'Create' },
    { path: '/library', label: 'Library' },
    { path: '/billing', label: 'Billing' },
    { path: '/docs', label: 'Docs' },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Video size={18} />
              </div>
              <span className="font-bold text-xl">ClipPilot</span>
            </Link>

            <div className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === item.path
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
              <CreditCard size={16} className="text-blue-400" />
              <span className="text-white font-medium">{credits}</span>
              <span className="text-slate-400 text-sm">credits</span>
            </div>

            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              Get 3 videos free
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
