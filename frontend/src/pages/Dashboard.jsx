import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import ComplaintCard from '../components/ComplaintCard.jsx';

const STATUS_FILTERS = ['', 'pending', 'assigned', 'in-progress', 'resolved', 'rejected'];

const Dashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    Promise.all([
      api.get('/complaints', { params }),
      api.get('/complaints/stats/summary'),
    ])
      .then(([listRes, statsRes]) => {
        if (!active) return;
        setComplaints(listRes.data);
        setStats(statsRes.data);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Failed to load data');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [statusFilter]);

  const heading = {
    user: 'My Complaints',
    agent: 'Assigned Complaints',
    admin: 'All Complaints',
  }[user.role];

  return (
    <div className="page">
      <div className="page-head">
        <h1>{heading}</h1>
        {user.role === 'user' && (
          <Link to="/complaints/new" className="btn primary">
            + New Complaint
          </Link>
        )}
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats['in-progress']}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats.resolved}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>
      )}

      <div className="filters">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s || 'all'}
            type="button"
            className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s || 'all'}
          </button>
        ))}
      </div>

      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : complaints.length === 0 ? (
        <div className="empty">No complaints found.</div>
      ) : (
        <div className="complaint-list">
          {complaints.map((c) => (
            <ComplaintCard key={c._id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
