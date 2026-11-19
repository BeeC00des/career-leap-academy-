import { useState } from 'react';
import Icon from './Icon.jsx';

export function PasswordInput({ id, value, onChange, placeholder = '••••••••', autoComplete = 'current-password', invalid }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input
        id={id} type={show ? 'text' : 'password'} className={`input${invalid ? ' invalid' : ''}`}
        value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} required
      />
      <button type="button" className="toggle-pw" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        <Icon name={show ? 'eyeOff' : 'eye'} />
      </button>
    </div>
  );
}

export function scorePassword(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s++;
  return Math.max(1, s);
}
const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

export function PasswordMeter({ value }) {
  const score = scorePassword(value);
  return (
    <>
      <div className="pw-meter" data-score={value ? score : 0} aria-hidden="true"><span /><span /><span /><span /></div>
      <span className="pw-hint">{value ? `${LABELS[score]} password` : 'Use 8+ characters with a mix of letters, numbers & symbols.'}</span>
    </>
  );
}

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type} show`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon name={type === 'success' ? 'checkCircle' : type === 'info' ? 'info' : 'alert'} />
      <div>{children}</div>
    </div>
  );
}

export function SubmitButton({ loading, children, ...rest }) {
  return (
    <button type="submit" className="btn btn-primary btn-block" disabled={loading} {...rest}>
      {loading ? <span className="spinner" /> : children}
    </button>
  );
}
