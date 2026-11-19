import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Icon from '../components/Icon.jsx';
import { Alert, PasswordInput, PasswordMeter, SubmitButton } from '../components/FormBits.jsx';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const d = await api('/auth/reset-password', { method: 'POST', body: { token, password } });
      if (user) await logout(); // reset invalidates existing sessions
      navigate('/login', { replace: true, state: { notice: d.message } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout>
        <div className="auth-icon"><Icon name="alert" /></div>
        <h1>Invalid reset link</h1>
        <p className="sub">This link is missing its token. Request a new one to continue.</p>
        <Link to="/forgot-password" className="btn btn-primary btn-block">Request a new link</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Fresh start." text="Choose a strong password you haven't used before.">
      <div className="auth-icon"><Icon name="lock" /></div>
      <h1>Set a new password</h1>
      <p className="sub">Your new password must be different from previously used passwords.</p>
      <form className="form" onSubmit={onSubmit} noValidate>
        <Alert>{error && <>{error}{error.includes('expired') && <> <Link to="/forgot-password">Request a new link</Link>.</>}</>}</Alert>
        <div className="field">
          <label htmlFor="password">New password</label>
          <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <PasswordMeter value={password} />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm new password</label>
          <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            invalid={confirm.length > 0 && confirm !== password} />
          {confirm.length > 0 && confirm !== password && <span className="field-error">Passwords do not match</span>}
        </div>
        <SubmitButton loading={loading}>Reset password</SubmitButton>
      </form>
      <p className="auth-foot"><Link to="/login">Back to log in</Link></p>
    </AuthLayout>
  );
}
