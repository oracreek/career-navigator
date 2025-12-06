import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Dashboard.css';

function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [apps, pos] = await Promise.all([
        api.getApplications(),
        api.getPositions(),
      ]);
      setApplications(apps);
      setPositions(pos);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="loading"></div>
      </div>
    );
  }

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const recentApplications = applications.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your job search progress</p>
      </div>

      <div className="grid grid-3 mb-4">
        <div className="card stat-card">
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{applications.length}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Active Interviews</div>
          <div className="stat-value">{statusCounts.interviewing || 0}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Work Positions</div>
          <div className="stat-value">{positions.length}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="section">
          <div className="section-header">
            <h2>Applications by Status</h2>
          </div>
          <div className="card">
            {Object.keys(statusCounts).length > 0 ? (
              <div className="status-list">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="status-item">
                    <span className={`status-badge status-${status}`}>
                      {status}
                    </span>
                    <span className="status-count">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No applications yet</p>
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <h2>Recent Applications</h2>
            <Link to="/applications/new" className="btn-primary">
              New Application
            </Link>
          </div>
          <div className="card">
            {recentApplications.length > 0 ? (
              <div className="recent-list">
                {recentApplications.map((app) => (
                  <Link
                    key={app.id}
                    to={`/applications/${app.id}`}
                    className="recent-item"
                  >
                    <div>
                      <div className="recent-title">{app.position_title}</div>
                      <div className="recent-company">{app.company}</div>
                    </div>
                    <span className={`status-badge status-${app.status}`}>
                      {app.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No applications yet</p>
                <Link to="/applications/new" className="btn-primary">
                  Create Your First Application
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="section mt-4">
        <div className="card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/positions" className="action-button">
              <span className="action-icon">📝</span>
              <span>Manage Work History</span>
            </Link>
            <Link to="/applications/new" className="action-button">
              <span className="action-icon">➕</span>
              <span>New Application</span>
            </Link>
            <Link to="/search" className="action-button">
              <span className="action-icon">🔍</span>
              <span>Search Applications</span>
            </Link>
            <Link to="/settings" className="action-button">
              <span className="action-icon">⚙️</span>
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
