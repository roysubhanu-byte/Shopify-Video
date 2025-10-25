import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { CreatePage } from './pages/CreatePage';
import { LibraryPage } from './pages/LibraryPage';
import { PricingPage } from './pages/PricingPage';
import { ExamplesPage } from './pages/ExamplesPage';
import { DocsPage } from './pages/DocsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/create" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/examples" element={<ExamplesPage />} />
        <Route path="/how-it-works" element={<DocsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
