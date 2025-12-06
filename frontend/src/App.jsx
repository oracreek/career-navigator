import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard/Dashboard';
import PositionsManager from './components/Positions/PositionsManager';
import NewApplicationWizard from './components/Applications/NewApplicationWizard';
import ApplicationDetail from './components/Applications/ApplicationDetail';
import { ApplicationsList, SearchView, SettingsView } from './components/Stubs';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-header">
            <h2>Career Navigator</h2>
          </div>
          <ul className="sidebar-nav">
            <li>
              <Link to="/">Dashboard</Link>
            </li>
            <li>
              <Link to="/positions">Work History</Link>
            </li>
            <li>
              <Link to="/applications">Applications</Link>
            </li>
            <li>
              <Link to="/applications/new">New Application</Link>
            </li>
            <li>
              <Link to="/search">Search</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/positions" element={<PositionsManager />} />
            <Route path="/applications" element={<ApplicationsList />} />
            <Route path="/applications/new" element={<NewApplicationWizard />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />
            <Route path="/search" element={<SearchView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
