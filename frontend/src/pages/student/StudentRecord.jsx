import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import './Student.css';

function Row({ label, value }) {
  return (
    <div>
      <div className="record-field-label">{label}</div>
      <div className="record-field-value">{value || <span className="muted">Not recorded</span>}</div>
    </div>
  );
}

export default function StudentRecord() {
  const { user, token } = useAuth();
  const [record, setRecord] = useState(undefined);
  const [visits, setVisits] = useState(null);

  useEffect(() => {
    api.get(`/records/${user.id}`, token).then((data) => setRecord(data.record));
    api.get(`/records/${user.id}/visits`, token).then((data) => setVisits(data.visits));
  }, [token, user.id]);

  return (
    <div>
      <h1>My Health Record</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 32 }}>
        Maintained by the clinic. Contact the front desk if anything here needs correcting.
      </p>

      {record === undefined ? (
        <p className="muted small">Loading…</p>
      ) : record === null ? (
        <EmptyState
          title="No record on file yet"
          description="Your medical record is created by the clinic during your first visit."
        />
      ) : (
        <section className="student-section">
          <div className="record-grid">
            <Row label="Blood group" value={record.blood_group} />
            <Row label="Genotype" value={record.genotype} />
            <Row label="Allergies" value={record.allergies} />
            <Row label="Chronic conditions" value={record.chronic_conditions} />
            <Row label="Emergency contact" value={record.emergency_contact_name} />
            <Row label="Emergency contact phone" value={record.emergency_contact_phone} />
          </div>
        </section>
      )}

      <section className="student-section">
        <h2>Visit history</h2>
        {visits === null ? (
          <p className="muted small">Loading…</p>
        ) : visits.length === 0 ? (
          <EmptyState title="No visits logged" description="Clinic visits you attend will be recorded here." />
        ) : (
          <ul className="student-list">
            {visits.map((v) => (
              <li key={v.id} className="student-list-row" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="student-list-title">{v.diagnosis || v.symptoms}</div>
                  <div className="muted small">
                    {new Date(v.visit_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {v.attended_by_name && ` · Seen by ${v.attended_by_name}`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
