import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import './Staff.css';

export default function StaffDashboard() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    api.get('/reports/summary', token).then(setSummary);
    api.get('/appointments?status=pending', token).then((data) => setPending(data.appointments));
  }, [token]);

  const firstName = user.full_name.split(' ')[0];

  return (
    <div>
      <div className="staff-page-head">
        <div>
          <h1>Good day, {firstName}</h1>
          <p className="muted">Here's what the clinic looks like today.</p>
        </div>
      </div>

      {summary && (
        <div className="stat-row">
          <div className="stat">
            <div className="stat-value mono">{summary.total_students}</div>
            <div className="stat-label">Registered students</div>
          </div>
          <div className="stat">
            <div className="stat-value mono">{summary.pending_appointments}</div>
            <div className="stat-label">Pending appointments</div>
          </div>
          <div className="stat">
            <div className="stat-value mono">{summary.visits_this_month}</div>
            <div className="stat-label">Visits this month</div>
          </div>
        </div>
      )}

      <section className="staff-section">
        <h2>Awaiting your review</h2>
        {pending === null ? (
          <p className="muted small">Loading…</p>
        ) : pending.length === 0 ? (
          <EmptyState title="Nothing pending" description="New appointment requests from students will show up here." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Reason</th>
                <th>Requested for</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pending.slice(0, 8).map((a) => (
                <tr key={a.id}>
                  <td>{a.student_name}<div className="muted small mono">{a.student_identifier}</div></td>
                  <td>{a.reason}</td>
                  <td className="mono">
                    {new Date(a.requested_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}, {a.requested_time.slice(0, 5)}
                  </td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pending && pending.length > 0 && (
          <Link to="/clinic/appointments" className="student-link">Review all appointments →</Link>
        )}
      </section>

      {summary?.common_complaints?.length > 0 && (
        <section className="staff-section">
          <h2>Frequent complaints, last 90 days</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Symptoms logged</th>
                <th>Occurrences</th>
              </tr>
            </thead>
            <tbody>
              {summary.common_complaints.map((c, i) => (
                <tr key={i}>
                  <td>{c.symptoms}</td>
                  <td className="mono">{c.occurrences}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
