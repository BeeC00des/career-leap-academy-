import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { Alert, PasswordInput, SubmitButton } from '../components/FormBits.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const notice = location.state?.notice;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Welcome back</h1>
      <p className="sub">Log in to continue your career simulation.</p>
      <form className="form" onSubmit={onSubmit} noValidate>
        <Alert type="success">{notice}</Alert>
        <Alert>{error}</Alert>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" className="input" placeholder="you@example.com" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <div className="field-row">
            <label htmlFor="password">Password</label>
            <Link to="/forgot-password" className="link small">Forgot password?</Link>
          </div>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <label className="check"><input type="checkbox" defaultChecked /> Keep me signed in</label>
        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
      <p className="auth-foot">New to CareerLeap? <Link to="/register">Apply for the next cohort</Link></p>
    </AuthLayout>
  );
}
