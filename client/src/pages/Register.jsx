import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { Alert, PasswordInput, PasswordMeter, SubmitButton } from '../components/FormBits.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { TRACKS } from '../data/content.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: params.get('email') || '',
    password: '',
    track: TRACKS.some((t) => t.id === params.get('track')) ? params.get('track') : 'data',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Your first role starts here." text="Pick a team, get a team lead and start shipping real work within your first week.">
      <h1>Create your account</h1>
      <p className="sub">Apply for the next cohort — it takes less than a minute.</p>
      <form className="form" onSubmit={onSubmit} noValidate>
        <Alert>{error}</Alert>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" className="input" placeholder="Jane Doe" autoComplete="name" value={form.name} onChange={set('name')} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" className="input" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={set('email')} required />
        </div>
        <div className="field">
          <label htmlFor="track">Career track</label>
          <select id="track" className="input" value={form.track} onChange={set('track')}>
            {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
          <PasswordMeter value={form.password} />
        </div>
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
      <p className="auth-foot">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthLayout>
  );
}
