import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';

/** Split-screen layout shared by login / register / forgot / reset. */
export default function AuthLayout({ children, title, text }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <Logo light />
        <div>
          <h2>{title || 'Learn on the job. Before the job.'}</h2>
          <p>{text || 'Join a simulated company team, report to an industry professional and build real experience for the German job market.'}</p>
        </div>
        <figure className="auth-quote" style={{ margin: 0 }}>
          <p>“A supportive environment with real tasks. I wasn't just learning — I was contributing to a team from week one.”</p>
          <figcaption className="who">
            <span className="avatar round" aria-hidden="true">A</span>
            <div>Angela<span>IT Infrastructure &amp; DevOps Intern</span></div>
          </figcaption>
        </figure>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <Link to="/" className="auth-back"><Icon name="arrowLeft" /> Back to website</Link>
          {children}
        </div>
      </main>
    </div>
  );
}
