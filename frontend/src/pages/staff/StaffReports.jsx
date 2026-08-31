import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import './Staff.css';

export default function StaffReports() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    api.get('/reports/summary', token).then(setSummary);
    api.get('/reports/visit-trend', token).then((data) => setTrend(data.trend));
  }, [token]);

  const maxVisits = trend?.length ? Math.max(...trend.map((t) => t.visits)) : 0;

  return (
    <div>
      <div className="staff-page-head">
        <div>
          <h1>Reports</h1>
          <p className="muted">Operational snapshot of clinic activity.</p>
        </div>
      </div>

      {summary && (
        <div className="stat-row">
          <div className="stat">
            <div className="stat-value mono">{summary.total_students}</div>
            <div className="stat-label">Registered students</div>
          </div>
          <div className="stat">
            <div className="stat-value mono">{summary.visits_this_month}</div>
            <div className="stat-label">Visits this month</div>
          </div>
          <div className="stat">
            <div className="stat-value mono">{summary.pending_appointments}</div>
            <div className="stat-label">Pending appointments</div>
          </div>
        </div>
      )}

      <section className="staff-section">
        <h2>Visit volume, last 30 days</h2>
        {trend === null ? (
          <p className="muted small">Loading…</p>
        ) : trend.length === 0 ? (
          <EmptyState title="No visits logged yet" description="Once clinic visits are recorded, the daily trend appears here." />
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
            {trend.map((t) => (
              <div key={t.day} title={`${t.day}: ${t.visits} visit(s)`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: '100%',
                    background: 'var(--primary)',
                    borderRadius: '2px 2px 0 0',
                    height: `${Math.max((t.visits / (maxVisits || 1)) * 110, 3)}px`,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {summary?.common_complaints?.length > 0 && (
        <section className="staff-section">
          <h2>Frequent complaints, last 90 days</h2>
          <table className="data-table">
            <thead>
              <tr><th>Symptoms logged</th><th>Occurrences</th></tr>
            </thead>
            <tbody>
              {summary.common_complaints.map((c, i) => (
                <tr key={i}><td>{c.symptoms}</td><td className="mono">{c.occurrences}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
