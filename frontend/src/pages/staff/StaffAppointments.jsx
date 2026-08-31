import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import './Staff.css';

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'completed', label: 'Completed' },
];

export default function StaffAppointments() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');
  const [appointments, setAppointments] = useState(null);

  function load() {
    const path = status ? `/appointments?status=${status}` : '/appointments';
    api.get(path, token).then((data) => setAppointments(data.appointments));
  }

  useEffect(load, [status, token]);

  async function updateStatus(id, newStatus) {
    await api.patch(`/appointments/${id}`, { status: newStatus }, token);
    load();
  }

  return (
    <div>
      <div className="staff-page-head">
        <div>
          <h1>Appointments</h1>
          <p className="muted">Review requests, approve visits, and keep the schedule current.</p>
        </div>
      </div>

      <div className="filter-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`filter-tab ${status === t.key ? 'active' : ''}`}
            onClick={() => setStatus(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {appointments === null ? (
        <p className="muted small">Loading…</p>
      ) : appointments.length === 0 ? (
        <EmptyState title="Nothing here" description="No appointments match this filter right now." />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Reason</th>
              <th>Requested for</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td className="clickable" onClick={() => navigate(`/clinic/students/${a.student_id}`)}>
                  {a.student_name}
                  <div className="muted small mono">{a.student_identifier}</div>
                </td>
                <td>{a.reason}</td>
                <td className="mono">
                  {new Date(a.requested_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}, {a.requested_time.slice(0, 5)}
                </td>
                <td><StatusBadge status={a.status} /></td>
                <td>
                  {a.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="sm" onClick={() => updateStatus(a.id, 'approved')}>Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, 'declined')}>Decline</Button>
                    </div>
                  )}
                  {a.status === 'approved' && (
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/clinic/students/${a.student_id}`)}>
                      Attend
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
