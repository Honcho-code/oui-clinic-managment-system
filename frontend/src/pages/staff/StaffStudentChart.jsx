import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Field from '../../components/Field';
import Button from '../../components/Button';
import Banner from '../../components/Banner';
import EmptyState from '../../components/EmptyState';
import MessageThread from '../../components/MessageThread';
import './Staff.css';

const emptyRecord = {
  blood_group: '', genotype: '', allergies: '', chronic_conditions: '',
  emergency_contact_name: '', emergency_contact_phone: '', notes: '',
};

const emptyVisit = { symptoms: '', diagnosis: '', treatment: '', follow_up_date: '', notes: '' };

export default function StaffStudentChart() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [searchParams] = useSearchParams();
  const [student, setStudent] = useState(null);
  const [tab, setTab] = useState(searchParams.get('tab') === 'messages' ? 'messages' : 'record');
  const [recordForm, setRecordForm] = useState(emptyRecord);
  const [visits, setVisits] = useState(null);
  const [visitForm, setVisitForm] = useState(emptyVisit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/users/students/${id}`, token).then((data) => setStudent(data.student)).catch(() => navigate('/clinic/students'));
    loadRecord();
    loadVisits();
  }, [id, token]);

  function loadRecord() {
    api.get(`/records/${id}`, token).then((data) => {
      if (data.record) setRecordForm(data.record);
    });
  }

  function loadVisits() {
    api.get(`/records/${id}/visits`, token).then((data) => setVisits(data.visits));
  }

  async function handleSaveRecord(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.put(`/records/${id}`, recordForm, token);
      setSuccess('Medical record saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogVisit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.post(`/records/${id}/visits`, visitForm, token);
      setVisitForm(emptyVisit);
      setSuccess('Visit logged.');
      loadVisits();
      setTab('visits');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!student) return <p className="muted small">Loading…</p>;

  return (
    <div>
      <div className="chart-header">
        <div>
          <h1>{student.full_name}</h1>
          <p className="muted mono small">{student.identifier} · {student.department}</p>
        </div>
        <div className="muted small" style={{ textAlign: 'right' }}>
          {student.phone && <div className="mono">{student.phone}</div>}
          <div>{student.email}</div>
        </div>
      </div>

      <div className="chart-tabs">
        <button className={`chart-tab ${tab === 'record' ? 'active' : ''}`} onClick={() => setTab('record')}>
          Medical Record
        </button>
        <button className={`chart-tab ${tab === 'visits' ? 'active' : ''}`} onClick={() => setTab('visits')}>
          Visit History
        </button>
        <button className={`chart-tab ${tab === 'log' ? 'active' : ''}`} onClick={() => setTab('log')}>
          Log a Visit
        </button>
        <button className={`chart-tab ${tab === 'messages' ? 'active' : ''}`} onClick={() => setTab('messages')}>
          Messages
        </button>
      </div>

      <Banner tone="error">{error}</Banner>
      <Banner tone="success">{success}</Banner>

      {tab === 'record' && (
        <form className="panel" onSubmit={handleSaveRecord}>
          <div className="auth-grid-2">
            <Field label="Blood group" htmlFor="blood_group">
              <input id="blood_group" value={recordForm.blood_group || ''} onChange={(e) => setRecordForm({ ...recordForm, blood_group: e.target.value })} placeholder="O+" />
            </Field>
            <Field label="Genotype" htmlFor="genotype">
              <input id="genotype" value={recordForm.genotype || ''} onChange={(e) => setRecordForm({ ...recordForm, genotype: e.target.value })} placeholder="AA" />
            </Field>
          </div>
          <Field label="Allergies" htmlFor="allergies">
            <textarea id="allergies" rows={2} value={recordForm.allergies || ''} onChange={(e) => setRecordForm({ ...recordForm, allergies: e.target.value })} placeholder="None known" />
          </Field>
          <Field label="Chronic conditions" htmlFor="chronic_conditions">
            <textarea id="chronic_conditions" rows={2} value={recordForm.chronic_conditions || ''} onChange={(e) => setRecordForm({ ...recordForm, chronic_conditions: e.target.value })} placeholder="None known" />
          </Field>
          <div className="auth-grid-2">
            <Field label="Emergency contact name" htmlFor="ec_name">
              <input id="ec_name" value={recordForm.emergency_contact_name || ''} onChange={(e) => setRecordForm({ ...recordForm, emergency_contact_name: e.target.value })} />
            </Field>
            <Field label="Emergency contact phone" htmlFor="ec_phone">
              <input id="ec_phone" value={recordForm.emergency_contact_phone || ''} onChange={(e) => setRecordForm({ ...recordForm, emergency_contact_phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Clinical notes" htmlFor="notes" helper="Visible only to clinic staff.">
            <textarea id="notes" rows={3} value={recordForm.notes || ''} onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })} />
          </Field>
          <Button type="submit" loading={saving}>Save record</Button>
        </form>
      )}

      {tab === 'visits' && (
        visits === null ? (
          <p className="muted small">Loading…</p>
        ) : visits.length === 0 ? (
          <EmptyState title="No visits logged" description="Use “Log a Visit” after seeing this student to start their history." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Symptoms</th>
                <th>Diagnosis</th>
                <th>Treatment</th>
                <th>Seen by</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr key={v.id}>
                  <td className="mono">{new Date(v.visit_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>{v.symptoms}</td>
                  <td>{v.diagnosis || '—'}</td>
                  <td>{v.treatment || '—'}</td>
                  <td>{v.attended_by_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === 'log' && (
        <form className="panel" onSubmit={handleLogVisit}>
          <Field label="Presenting symptoms" htmlFor="symptoms" required>
            <textarea id="symptoms" required rows={2} value={visitForm.symptoms} onChange={(e) => setVisitForm({ ...visitForm, symptoms: e.target.value })} placeholder="Fever, sore throat" />
          </Field>
          <Field label="Diagnosis" htmlFor="diagnosis">
            <input id="diagnosis" value={visitForm.diagnosis} onChange={(e) => setVisitForm({ ...visitForm, diagnosis: e.target.value })} placeholder="Upper respiratory tract infection" />
          </Field>
          <Field label="Treatment given" htmlFor="treatment">
            <textarea id="treatment" rows={2} value={visitForm.treatment} onChange={(e) => setVisitForm({ ...visitForm, treatment: e.target.value })} placeholder="Paracetamol 500mg, rest advised" />
          </Field>
          <Field label="Follow-up date" htmlFor="follow_up" helper="Leave blank if none needed.">
            <input id="follow_up" type="date" value={visitForm.follow_up_date} onChange={(e) => setVisitForm({ ...visitForm, follow_up_date: e.target.value })} />
          </Field>
          <Button type="submit" loading={saving}>Save visit</Button>
        </form>
      )}

      {tab === 'messages' && (
        <MessageThread studentId={id} canPrescribe />
      )}
    </div>
  );
}
