import './EmptyState.css';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description && <p className="muted">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
