// Stub components - implement these based on the architecture document

// PositionsManager.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';

function PositionsManager() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPositions();
  }, []);

  async function loadPositions() {
    try {
      const data = await api.getPositions();
      setPositions(data);
    } catch (error) {
      console.error('Failed to load positions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Work History</h1>
        <p>Manage your professional positions</p>
      </div>
      
      {/* TODO: Implement position list and form */}
      <div className="card">
        <p>Position Manager - To be implemented</p>
        <p>Count: {positions.length}</p>
      </div>
    </div>
  );
}

export default PositionsManager;
