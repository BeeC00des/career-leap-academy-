import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Icon from '../components/Icon.jsx';
import { Alert, SubmitButton } from '../components/FormBits.jsx';
import { api } from '../api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const d = await api('/auth/forgot-password', { method: 'POST', body: { email: email.trim() } });
      setSent(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    const devPath = sent.devResetUrl ? new URL(sent.devResetUrl).pathname + new URL(sent.devResetUrl).search : null;
    return (
      <AuthLayout title="Happens to the best of us." text="We'll get you back to your team in no time.">
        <div className="auth-icon"><Icon name="mail" /></div>
        <h1>Check your inbox</h1>
        <p className="sub">If an account exists for <strong>{email}</strong>, we've sent a link to reset your password. The link expires in 1 hour.</p>
        {devPath && (
          <Alert type="info">
            Development mode (no SMTP configured): <Link to={devPath}>open the reset link</Link>. It's also printed in the server console.
          </Alert>
        )}
        <div className="form" style={{ marginTop: 24 }}>
          <Link to="/login" className="btn btn-primary btn-block">Back to log in</Link>
          <button type="button" className="btn btn-outline btn-block" onClick={() => setSent(null)}>Use a different email</button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Happens to the best of us." text="We'll get you back to your team in no time.">
      <div className="auth-icon"><Icon name="key" /></div>
      <h1>Forgot password?</h1>
      <p className="sub">Enter the email you signed up with and we'll send you a reset link.</p>
      <form className="form" onSubmit={onSubmit} noValidate>
        <Alert>{error}</Alert>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" className="input" placeholder="you@example.com" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <SubmitButton loading={loading}>Send reset link</SubmitButton>
      </form>
      <p className="auth-foot">Remembered it? <Link to="/login">Back to log in</Link></p>
    </AuthLayout>
  );
}
