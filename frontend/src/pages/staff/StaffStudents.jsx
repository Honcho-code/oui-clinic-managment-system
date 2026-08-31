import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import './Staff.css';

export default function StaffStudents() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [students, setStudents] = useState(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      const path = q.trim() ? `/users/students?q=${encodeURIComponent(q.trim())}` : '/users/students';
      api.get(path, token).then((data) => setStudents(data.students));
    }, 250);
    return () => clearTimeout(handle);
  }, [q, token]);

  return (
    <div>
      <div className="staff-page-head">
        <div>
          <h1>Students & Records</h1>
          <p className="muted">Find a student to view or update their medical record.</p>
        </div>
      </div>

      <div className="search-bar">
        <input
          placeholder="Search by name, matric number, or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {students === null ? (
        <p className="muted small">Loading…</p>
      ) : students.length === 0 ? (
        <EmptyState title="No students found" description="Try a different name or matric number." />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Matric no.</th>
              <th>Department</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="clickable" onClick={() => navigate(`/clinic/students/${s.id}`)}>
                <td>{s.full_name}</td>
                <td className="mono">{s.identifier}</td>
                <td>{s.department}</td>
                <td className="mono">{s.phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
