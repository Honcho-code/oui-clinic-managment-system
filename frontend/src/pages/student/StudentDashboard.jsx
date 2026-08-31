import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import './Student.css';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState(null);
  const [record, setRecord] = useState(undefined);

  useEffect(() => {
    api.get('/appointments', token).then((data) => setAppointments(data.appointments));
    api.get(`/records/${user.id}`, token).then((data) => setRecord(data.record));
  }, [token, user.id]);

  const upcoming = appointments?.filter((a) => ['pending', 'approved'].includes(a.status)) || [];
  const firstName = user.full_name.split(' ')[0];

  return (
    <div>
      <h1>Good day, {firstName}</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 40 }}>
        {user.identifier} · {user.department}
      </p>

      <section className="student-section">
        <h2>Next at the clinic</h2>
        {appointments === null ? (
          <p className="muted small">Loading…</p>
        ) : upcoming.length === 0 ? (
          <EmptyState
            title="Nothing scheduled"
            description="Book an appointment if you need to see the clinic — walk-ins are also welcome during opening hours."
            action={<Link to="/portal/appointments"><Button size="sm">Book an appointment</Button></Link>}
          />
        ) : (
          <ul className="student-list">
            {upcoming.slice(0, 3).map((a) => (
              <li key={a.id} className="student-list-row">
                <div>
                  <div className="student-list-title">{a.reason}</div>
                  <div className="muted small">
                    {formatDate(a.requested_date)} at {a.requested_time.slice(0, 5)}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="student-section">
        <h2>Health record</h2>
        {record === undefined ? (
          <p className="muted small">Loading…</p>
        ) : record === null ? (
          <p className="muted">
            The clinic hasn't added your medical record yet. This is created at your first visit.
          </p>
        ) : (
          <ul className="student-list">
            <li className="student-list-row">
              <span className="muted">Blood group</span>
              <span className="mono">{record.blood_group || 'Not recorded'}</span>
            </li>
            <li className="student-list-row">
              <span className="muted">Genotype</span>
              <span className="mono">{record.genotype || 'Not recorded'}</span>
            </li>
          </ul>
        )}
        <Link to="/portal/record" className="student-link">View full record →</Link>
      </section>
    </div>
  );
}
