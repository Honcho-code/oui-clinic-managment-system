import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import './Staff.css';

function preview(thread) {
  if (thread.type === 'prescription') return `Prescription sent`;
  return thread.body.length > 80 ? `${thread.body.slice(0, 80)}…` : thread.body;
}

function formatTime(ts) {
  return new Date(ts).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function StaffMessages() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState(null);

  useEffect(() => {
    api.get('/messages', token).then((data) => setThreads(data.threads));
  }, [token]);

  return (
    <div>
      <div className="staff-page-head">
        <div>
          <h1>Messages</h1>
          <p className="muted">Conversations students have started with the clinic.</p>
        </div>
      </div>

      {threads === null ? (
        <p className="muted small">Loading…</p>
      ) : threads.length === 0 ? (
        <EmptyState title="No conversations yet" description="When a student messages the clinic, the thread will appear here." />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Last message</th>
              <th>From</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {threads.map((t) => (
              <tr key={t.student_id} className="clickable" onClick={() => navigate(`/clinic/students/${t.student_id}?tab=messages`)}>
                <td>
                  {t.student_name}
                  <div className="muted small mono">{t.student_identifier}</div>
                </td>
                <td>{preview(t)}</td>
                <td className="muted small">{t.sender_role === 'student' ? 'Student' : t.sender_name}</td>
                <td className="mono small">{formatTime(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
