import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Field from '../components/Field';
import Button from '../components/Button';
import Banner from '../components/Banner';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email.trim(), form.password);
      navigate(user.role === 'student' ? '/portal' : '/clinic');
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
        <h1>Sign in</h1>
        <p className="muted auth-subhead">Access your health record or the clinic desk.</p>

        <Banner tone="error">{error}</Banner>

        <form onSubmit={handleSubmit}>
          <Field label="Email address" htmlFor="email" required>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@oui.edu.ng"
            />
          </Field>
          <Field label="Password" htmlFor="password" required>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" loading={loading} style={{ width: '100%' }}>
            Sign in
          </Button>
        </form>

        <p className="auth-footer muted small">
          New student? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
