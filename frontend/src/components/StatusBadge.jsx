const StatusBadge = ({ status }) => (
  <span className={`badge status-${status}`}>{status}</span>
);

export default StatusBadge;
