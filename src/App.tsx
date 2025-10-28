import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
// ⬇️ Import the *default* export (no braces)
// ✅ correct (named export)
import { CreatePage } from './pages/CreatePage';

import { PromptPage } from './pages/PromptPage';
import { LibraryPage } from './pages/LibraryPage';
import { BillingPage } from './pages/BillingPage';
import { PricingPage } from './pages/PricingPage';
import { ExamplesPage } from './pages/ExamplesPage';
import { DocsPage } from './pages/DocsPage';
import { checkApiHealth } from './lib/apiHealth';

function App() {
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    checkApiHealth().then((isHealthy) => {
      setApiHealthy(isHealthy);
      if (!isHealthy) {
        console.warn(
          '⚠️ API server is not running.\n' +
            'To start both frontend and backend, run:\n' +
            '  npm run dev:full\n\n' +
            'Current setup only runs the frontend (Vite) server.\n' +
            'The backend API server at http://localhost:8787 is required for full functionality.'
        );
      } else {
        console.info('✅ API server is running at http://localhost:8787');
      }
    });
  }, []);

  return (
    <Router>
      {apiHealthy === false && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-900 bg-opacity-95 border-b border-yellow-700 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
            <p className="text-yellow-100 text-sm">
              <strong>API Server Not Running:</strong> Some features may not work. Start both servers with{' '}
              <code className="bg-yellow-950 px-2 py-0.5 rounded text-yellow-200">npm run dev:full</code>
            </p>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prompt"
          element={
            <ProtectedRoute>
              <PromptPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/examples" element={<ExamplesPage />} />
        <Route path="/how-it-works" element={<DocsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
