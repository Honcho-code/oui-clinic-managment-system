import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Field from '../components/Field';
import Button from '../components/Button';
import Banner from '../components/Banner';
import './Auth.css';

const initial = { full_name: '', email: '', identifier: '', department: '', phone: '', password: '' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key) {
    return (e) => setForm({ ...form, [key]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/portal');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">OUI</span> Clinic
        </div>
        <h1>Create your account</h1>
        <p className="muted auth-subhead">Register with your matric number to use the health portal.</p>

        <Banner tone="error">{error}</Banner>

        <form onSubmit={handleSubmit}>
          <Field label="Full name" htmlFor="full_name" required>
            <input id="full_name" required value={form.full_name} onChange={update('full_name')} placeholder="Adaeze Okafor" />
          </Field>
          <Field label="Email address" htmlFor="email" required>
            <input id="email" type="email" required value={form.email} onChange={update('email')} placeholder="you@oui.edu.ng" />
          </Field>
          <div className="auth-grid-2">
            <Field label="Matric number" htmlFor="identifier" required>
              <input id="identifier" required value={form.identifier} onChange={update('identifier')} placeholder="OUI/23/CS/337" />
            </Field>
            <Field label="Department" htmlFor="department" required>
              <input id="department" required value={form.department} onChange={update('department')} placeholder="Computer Science" />
            </Field>
          </div>
          <Field label="Phone number" htmlFor="phone" helper="Used for appointment reminders.">
            <input id="phone" value={form.phone} onChange={update('phone')} placeholder="0803 123 4567" />
          </Field>
          <Field label="Password" htmlFor="password" required helper="At least 8 characters.">
            <input id="password" type="password" required minLength={8} value={form.password} onChange={update('password')} placeholder="••••••••" />
          </Field>
          <Button type="submit" loading={loading} style={{ width: '100%' }}>
            Create account
          </Button>
        </form>

        <p className="auth-footer muted small">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
