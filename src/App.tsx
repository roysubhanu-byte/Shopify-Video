import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TopNav } from './components/TopNav';
import { CreatePage } from './pages/CreatePage';
import { LibraryPage } from './pages/LibraryPage';
import { BillingPage } from './pages/BillingPage';
import { DocsPage } from './pages/DocsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950">
        <TopNav />
        <Routes>
          <Route path="/" element={<CreatePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
