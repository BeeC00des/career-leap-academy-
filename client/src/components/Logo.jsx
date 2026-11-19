import { Link } from 'react-router-dom';

export default function Logo({ light = false, to = '/' }) {
  return (
    <Link to={to} className={`logo${light ? ' light' : ''}`} aria-label="CareerLeap home">
      <span className="logo-mark">
        <svg viewBox="0 0 24 24" fill="none" stroke={light ? '#fff' : '#3fa6b2'} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 16l5-5 3 3 6-7" />
        </svg>
      </span>
      CareerLeap
    </Link>
  );
}
