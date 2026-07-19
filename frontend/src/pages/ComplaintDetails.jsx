import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const STATUSES = ['pending', 'assigned', 'in-progress', 'resolved', 'rejected'];

const ComplaintDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [agents, setAgents] = useState([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/complaints/${id}`);
      setComplaint(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaint');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user.role === 'admin') {
      api.get('/users/agents').then(({ data }) => setAgents(data)).catch(() => {});
    }
  }, [user.role]);

  const handleAssign = async (agentId) => {
    if (!agentId) return;
    try {
      const { data } = await api.put(`/complaints/${id}/assign`, { agentId });
      setComplaint(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign');
    }
  };

  const handleStatus = async (status) => {
    try {
      const { data } = await api.put(`/complaints/${id}/status`, { status });
      setComplaint(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      const { data } = await api.post(`/complaints/${id}/notes`, { message: note });
      setComplaint(data);
      setNote('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add note');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this complaint?')) return;
    try {
      await api.delete(`/complaints/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="page">Loading...</div>;
  if (!complaint) return <div className="page"><div className="alert error">{error || 'Not found'}</div></div>;

  const canManage = user.role === 'admin' || user.role === 'agent';
  const canDelete =
    user.role === 'admin' ||
    (complaint.createdBy._id === user._id && complaint.status === 'pending');

  return (
    <div className="page narrow">
      <button type="button" className="btn-link" onClick={() => navigate(-1)}>
        &larr; Back
      </button>

      {error && <div className="alert error">{error}</div>}

      <div className="detail-card">
        <div className="detail-head">
          <h1>{complaint.title}</h1>
          <StatusBadge status={complaint.status} />
        </div>
        <div className="complaint-meta">
          <span className="chip">{complaint.category}</span>
          <span className={`chip priority-${complaint.priority}`}>{complaint.priority}</span>
          {complaint.location && <span className="chip muted">{complaint.location}</span>}
        </div>
        <p className="detail-desc">{complaint.description}</p>
        <div className="detail-people">
          <span>Raised by: <strong>{complaint.createdBy?.name}</strong></span>
          <span>
            Assigned to:{' '}
            <strong>{complaint.assignedTo ? complaint.assignedTo.name : 'Unassigned'}</strong>
          </span>
          <span>Created: {new Date(complaint.createdAt).toLocaleString()}</span>
        </div>

        {canManage && (
          <div className="manage-panel">
            <h3>Manage</h3>
            <div className="manage-row">
              <label>
                Status
                <select
                  value={complaint.status}
                  onChange={(e) => handleStatus(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              {user.role === 'admin' && (
                <label>
                  Assign agent
                  <select
                    value={complaint.assignedTo?._id || ''}
                    onChange={(e) => handleAssign(e.target.value)}
                  >
                    <option value="">Select agent</option>
                    {agents.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>
        )}

        {canDelete && (
          <button type="button" className="btn danger" onClick={handleDelete}>
            Delete Complaint
          </button>
        )}
      </div>

      <div className="notes-section">
        <h3>Updates & Comments</h3>
        {complaint.notes.length === 0 && <p className="muted">No updates yet.</p>}
        <ul className="notes-list">
          {complaint.notes.map((n) => (
            <li key={n._id} className="note">
              <div className="note-head">
                <strong>{n.authorName || 'User'}</strong>
                <span className="muted">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p>{n.message}</p>
            </li>
          ))}
        </ul>
        <form className="note-form" onSubmit={handleAddNote}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Add a comment or update..."
          />
          <button type="submit" className="btn primary">
            Post
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComplaintDetails;
