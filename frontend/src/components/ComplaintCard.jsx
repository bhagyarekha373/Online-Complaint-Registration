import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';

const ComplaintCard = ({ complaint }) => (
  <Link to={`/complaints/${complaint._id}`} className="complaint-card">
    <div className="complaint-card-head">
      <h3>{complaint.title}</h3>
      <StatusBadge status={complaint.status} />
    </div>
    <p className="complaint-desc">{complaint.description}</p>
    <div className="complaint-meta">
      <span className="chip">{complaint.category}</span>
      <span className={`chip priority-${complaint.priority}`}>{complaint.priority}</span>
      {complaint.assignedTo && (
        <span className="chip">Agent: {complaint.assignedTo.name}</span>
      )}
      <span className="chip muted">
        {new Date(complaint.createdAt).toLocaleDateString()}
      </span>
    </div>
  </Link>
);

export default ComplaintCard;
