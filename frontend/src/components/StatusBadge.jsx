import './StatusBadge.css';

const LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  completed: 'Completed',
  cancelled: 'Cancelled',
  declined: 'Declined',
};

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{LABELS[status] || status}</span>;
}
