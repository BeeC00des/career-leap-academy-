import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { DIFFERENT, STEPS, TESTIMONIALS, TRACKS } from '../data/content.js';

const CALENDLY = 'https://calendly.com/';

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return undefined; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function Nav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const links = [['#how', 'How it works'], ['#why', 'Why CareerLeap'], ['#tracks', 'Career Tracks'], ['#stories', 'Stories']];
  return (
    <header className={`nav${scrolled ? ' scrolled' : ''}`}>
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Primary">
          {links.map(([h, l]) => <a key={h} href={h}>{l}</a>)}
        </nav>
        <div className="nav-cta">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">Go to dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </>
          )}
        </div>
        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>
      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {links.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)}>{l}</a>)}
        {user ? <Link to="/dashboard" className="btn btn-primary">Go to dashboard</Link> : (
          <>
            <Link to="/login" className="btn btn-outline">Log in</Link>
            <Link to="/register" className="btn btn-primary">Get started</Link>
          </>
        )}
      </div>
    </header>
  );
}

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="mock-card mock-main">
        <div className="mock-head">
          <span className="avatar">JD</span>
          <div><div className="mock-name">Junior Data Analyst</div><div className="mock-sub">Data, BI &amp; AI Team</div></div>
        </div>
        <div className="mock-box">
          <div className="mock-label">Sprint progress · Week 6</div>
          <div className="mock-value">72%</div>
          <div className="progress" style={{ marginTop: 10 }}><span style={{ width: '72%' }} /></div>
        </div>
        <div className="task-row active"><span className="l"><Icon name="chart" size={15} /> Clean Q3 dataset</span><span className="radio on" /></div>
        <div className="task-row"><span className="l"><Icon name="tasks" size={15} /> KPI dashboard draft</span><span className="radio" /></div>
        <div className="btn btn-dark btn-block btn-sm" style={{ marginTop: 6 }}>Submit to team lead</div>
      </div>
      <div className="mock-card mock-accent">
        <div className="row">
          <div className="k">Programme</div>
          <div className="v">3–6 months</div>
        </div>
        <div className="row foot"><span>CAREERLEAP</span><span>DE</span></div>
      </div>
      <div className="mock-card mock-float">
        <span className="icon-tile"><Icon name="checkCircle" /></span>
        <div><div className="mock-name">Feedback received</div><div className="mock-sub">From your team lead</div></div>
      </div>
    </div>
  );
}

function MiniChart() {
  const pts = [[0, 92], [60, 70], [120, 62], [180, 50], [240, 44], [300, 32], [360, 10]];
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  return (
    <svg viewBox="0 0 360 100" preserveAspectRatio="none" style={{ width: '100%', height: 130 }}>
      <defs>
        <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2b8f9b" stopOpacity=".25" />
          <stop offset="1" stopColor="#2b8f9b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L360,100 L0,100 Z`} fill="url(#lg)" />
      <path d={line} fill="none" stroke="#2b8f9b" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function Landing() {
  useReveal();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  return (
    <>
      <Nav />

      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1 className="h1">Learn on the job.<br /><span className="accent">Before</span> the job.</h1>
            <p className="lead">A 3–6 month career simulation where you take a junior role in a real team, report to an industry professional and build experience for the German job market.</p>
            <form className="hero-actions" onSubmit={(e) => { e.preventDefault(); navigate(`/register?email=${encodeURIComponent(email)}`); }}>
              <input className="input" type="email" placeholder="Your email address" aria-label="Email address"
                value={email} onChange={(e) => setEmail(e.target.value)} style={{ maxWidth: 260 }} />
              <button className="btn btn-primary" type="submit">Apply for next cohort <Icon name="arrowUpRight" /></button>
            </form>
            <div className="badges">
              <span className="badge"><span className="dot" />3–6 months</span>
              <span className="badge"><span className="dot" />Real team tasks</span>
              <span className="badge"><span className="dot" />German market focus</span>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* OVERLAP FEATURE CARD */}
      <div className="overlap-bg">
        <div className="container overlap">
          <div className="feature-card reveal">
            <div className="feature-top">
              <div>
                <span className="eyebrow">Not a bootcamp</span>
                <h2 className="h2" style={{ fontSize: 'clamp(24px,2.6vw,32px)', fontWeight: 500 }}>Experience that grows<br />with your career.</h2>
              </div>
              <p>CareerLeap Org runs four simulation teams. You join one, work like a junior hire, and leave with proof you can do the job.</p>
            </div>
            <div className="feature-grid">
              {TRACKS.map((t) => (
                <div className="feature" key={t.id}>
                  <Icon name={t.icon} className="ic" strokeWidth={1.5} />
                  <h4>{t.name}</h4>
                  <p>{t.tags.slice(0, 2).join(', ')} and more.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WHY */}
      <section className="section section-white" id="why">
        <div className="container">
          <div className="section-head center reveal">
            <span className="eyebrow">Why CareerLeap</span>
            <h2 className="h2" style={{ fontWeight: 500 }}>Why participants choose CareerLeap</h2>
          </div>
          <div className="bento">
            <div className="bento-card reveal">
              <div className="big-stat">4</div>
              <h3>Simulation teams with real company structure</h3>
            </div>
            <div className="bento-card reveal">
              <h3>From learning to working — reported to a real team lead</h3>
              <div className="flow" aria-hidden="true">
                <span className="node n1"><Icon name="user" /></span>
                <svg className="arrows" viewBox="0 0 80 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 8h74l-6-5M78 16H4l6 5" /></svg>
                <span className="node n2"><Icon name="briefcase" /></span>
              </div>
            </div>
            <div className="bento-card wide reveal">
              <div style={{ paddingBottom: 36 }}>
                <h3>Career coaching included</h3>
                <p className="small muted">CV, LinkedIn, interview prep and job-search strategy — built for the German job market.</p>
              </div>
              <div className="chart-card">
                <div className="chart-head">
                  <div><div className="mock-label">Portfolio & experience</div><div className="v">Week 1 → 16</div></div>
                  <span className="chip">3–6 months <Icon name="chevronDown" size={12} /></span>
                </div>
                <MiniChart />
                <div className="chart-axis"><span>Onboard</span><span>Sprint 1</span><span>Sprint 2</span><span>Project</span><span>Coaching</span><span>Apply</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="band-dark" id="how">
        <div className="container">
          <span className="eyebrow light">How the simulation works</span>
          <h2 className="h2 reveal">Four steps from learner to job-ready junior hire.</h2>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step reveal" key={s.title}>
                <div className="num">{i + 1}</div>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRACKS */}
      <section className="section section-white" id="tracks">
        <div className="container">
          <div className="section-head center reveal">
            <span className="eyebrow">Choose your team</span>
            <h2 className="h2" style={{ fontWeight: 500 }}>Four career tracks.<br />One real team experience.</h2>
            <p className="lead">Every track runs like a company team — with sprints, deliverables and a professional team lead.</p>
          </div>
          <div className="stats reveal" style={{ marginBottom: 56 }}>
            <div className="stat"><div className="v">4</div><div className="k">Simulation teams</div></div>
            <div className="stat"><div className="v">3–6</div><div className="k">Months programme</div></div>
            <div className="stat"><div className="v">1:1</div><div className="k">Career coaching</div></div>
            <div className="stat"><div className="v">DE</div><div className="k">Job-market focus</div></div>
          </div>
          <span className="eyebrow" style={{ display: 'block', textAlign: 'center' }}>Career tracks</span>
          <div className="tracks-grid">
            {TRACKS.map((t, i) => (
              <Link to={`/register?track=${t.id}`} className={`track reveal${i === 1 ? ' featured' : ''}`} key={t.id}>
                <div className="track-top">
                  <h3>{t.name}</h3>
                  <span className={i === 1 ? '' : 'icon-tile'}><Icon name={t.icon} size={20} /></span>
                </div>
                <div className="tags">{t.tags.map((g) => <span className="tag" key={g}>{g}</span>)}</div>
                <div className="track-foot"><span>View track</span><span className="arrow-btn"><Icon name="arrowRight" /></span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DIFFERENT */}
      <section className="section">
        <div className="container">
          <div className="section-head center reveal">
            <span className="eyebrow">Why this is different</span>
            <h2 className="h2" style={{ fontWeight: 500 }}>Not a bootcamp. A first job.</h2>
          </div>
          <div className="diff-grid">
            {DIFFERENT.map((d) => (
              <div className="diff reveal" key={d.title}>
                <span className="icon-tile"><Icon name={d.icon} /></span>
                <h4>{d.title}</h4>
                <p>{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORIES */}
      <section className="section section-white" id="stories">
        <div className="container">
          <div className="section-head center reveal">
            <span className="eyebrow">Participant stories</span>
            <h2 className="h2" style={{ fontWeight: 500 }}>From participants to professionals</h2>
          </div>
          <div className="testimonials">
            {TESTIMONIALS.map((t) => (
              <figure className="quote reveal" key={t.name} style={{ margin: 0 }}>
                <blockquote>{t.quote}</blockquote>
                <figcaption className="who">
                  <span className="avatar round">{t.name[0]}</span>
                  <div><div className="mock-name">{t.name}</div><div className="mock-sub">{t.role}</div></div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-wrap section-white">
        <div className="container">
          <div className="cta reveal">
            <div>
              <span className="eyebrow light">Next cohort</span>
              <h2 className="h2">Ready to get the experience employers ask for?</h2>
              <p>Apply for the next cohort or book a free info session to see if CareerLeap is right for you.</p>
            </div>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary">Apply now</Link>
              <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn btn-ghost-light">Book an info session <Icon name="arrowUpRight" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Logo />
              <p className="tagline">Learn on the job. Before the job. Career simulations for the German job market.</p>
            </div>
            <div><h5>Programmes</h5><ul><li><a href="#tracks">Career Tracks</a></li><li><a href="#">Join as a Team Lead</a></li></ul></div>
            <div><h5>Company</h5><ul><li><a href="#why">Why CareerLeap</a></li><li><a href="#">Careers</a></li><li><a href="#">Blog</a></li></ul></div>
            <div><h5>Support</h5><ul><li><a href="#">Help Center</a></li><li><a href="#">Privacy</a></li><li><a href="#">Cookie Policy</a></li><li><a href="#">Impressum</a></li></ul></div>
            <div>
              <h5>Follow us</h5>
              <div className="socials">
                <a href="#" aria-label="LinkedIn"><Icon name="linkedin" /></a>
                <a href="#" aria-label="Instagram"><Icon name="instagram" /></a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} CareerLeap. All rights reserved.</span>
            <span>Made for the German job market</span>
          </div>
        </div>
      </footer>
    </>
  );
}
