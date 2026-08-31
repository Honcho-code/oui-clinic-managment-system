import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Field from '../../components/Field';
import Button from '../../components/Button';
import Banner from '../../components/Banner';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import './Student.css';

const today = new Date().toISOString().slice(0, 10);

export default function StudentAppointments() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState(null);
  const [form, setForm] = useState({ reason: '', requested_date: '', requested_time: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function load() {
    api.get('/appointments', token).then((data) => setAppointments(data.appointments));
  }

  useEffect(load, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/appointments', form, token);
      setForm({ reason: '', requested_date: '', requested_time: '' });
      setSuccess('Appointment requested. The clinic will confirm shortly.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    await api.del(`/appointments/${id}`, token);
    load();
  }

  return (
    <div>
      <h1>Appointments</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 32 }}>
        Request a time to see the clinic. You'll see the status update here once staff review it.
      </p>

      <form className="booking-form" onSubmit={handleSubmit}>
        <h3 style={{ marginBottom: 16 }}>Request an appointment</h3>
        <Banner tone="error">{error}</Banner>
        <Banner tone="success">{success}</Banner>
        <Field label="Reason for visit" htmlFor="reason" required>
          <textarea
            id="reason"
            required
            rows={3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="e.g. Persistent headache since yesterday"
          />
        </Field>
        <div className="auth-grid-2">
          <Field label="Preferred date" htmlFor="date" required>
            <input
              id="date"
              type="date"
              required
              min={today}
              value={form.requested_date}
              onChange={(e) => setForm({ ...form, requested_date: e.target.value })}
            />
          </Field>
          <Field label="Preferred time" htmlFor="time" required>
            <input
              id="time"
              type="time"
              required
              value={form.requested_time}
              onChange={(e) => setForm({ ...form, requested_time: e.target.value })}
            />
          </Field>
        </div>
        <Button type="submit" loading={loading}>Submit request</Button>
      </form>

      <h2 style={{ marginBottom: 16 }}>Your appointments</h2>
      {appointments === null ? (
        <p className="muted small">Loading…</p>
      ) : appointments.length === 0 ? (
        <EmptyState title="No appointments yet" description="Requests you submit will appear here." />
      ) : (
        <ul className="student-list">
          {appointments.map((a) => (
            <li key={a.id} className="student-list-row">
              <div>
                <div className="student-list-title">{a.reason}</div>
                <div className="muted small">
                  {new Date(a.requested_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' '}at {a.requested_time.slice(0, 5)}
                  {a.nurse_name && ` · With ${a.nurse_name}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <StatusBadge status={a.status} />
                {a.status === 'pending' && (
                  <button className="student-link" style={{ color: 'var(--error)' }} onClick={() => handleCancel(a.id)}>
                    Cancel
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
