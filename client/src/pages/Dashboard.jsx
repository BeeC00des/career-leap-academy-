import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

const initials = (n = '') => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || 'U';
const fmtDay = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const TYPE_PILL = { 'Sprint task': 'teal', Deliverable: 'navy', Review: 'amber', Coaching: 'green' };

function useToast() {
  const [msg, setMsg] = useState('');
  const t = useRef();
  const show = useCallback((m) => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(''), 2400); }, []);
  const el = <div className={`toast${msg ? ' show' : ''}`} role="status"><Icon name="checkCircle" />{msg}</div>;
  return [show, el];
}

function HoursChart({ data }) {
  const [hover, setHover] = useState(null);
  const W = 600, H = 220, P = 24;
  const max = Math.max(16, ...data) * 1.15;
  const step = data.length > 1 ? (W - P * 2) / (data.length - 1) : 0;
  const pts = data.map((v, i) => [P + i * step, H - P - (v / max) * (H - P * 2)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  if (!data.length) return <p className="muted small">No hours logged yet.</p>;
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Hours logged per week: ${data.join(', ')}`}>
        <defs>
          <linearGradient id="dg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#2b8f9b" stopOpacity=".22" />
            <stop offset="1" stopColor="#2b8f9b" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={P} x2={W - P} y1={P + f * (H - P * 2)} y2={P + f * (H - P * 2)} stroke="#e3eaee" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={`${line} L${pts.at(-1)[0]},${H - P} L${P},${H - P} Z`} fill="url(#dg)" />
        <path d={line} fill="none" stroke="#2b8f9b" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <rect x={x - step / 2} y={0} width={step || W} height={H} fill="transparent" />
            <circle cx={x} cy={y} r={hover === i ? 5 : 3.5} fill="#fff" stroke="#2b8f9b" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="chart-tip show" style={{ left: `${(pts[hover][0] / W) * 100}%`, top: `${(pts[hover][1] / H) * 100}%` }}>
          Week {hover + 1}: <b>{data[hover]}h</b>
        </div>
      )}
      <div className="chart-axis">{data.map((_, i) => <span key={i}>Wk {i + 1}</span>)}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [menu, setMenu] = useState(false);
  const [side, setSide] = useState(false);
  const [hours, setHours] = useState('');
  const [toast, toastEl] = useToast();
  const menuRef = useRef(null);

  const load = useCallback(() => {
    api('/dashboard').then(setData).catch((e) => {
      if (e.status === 401) navigate('/login', { replace: true });
      else setError(e.message);
    });
  }, [navigate]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true, state: { notice: 'You have been logged out.' } });
  }

  async function toggleTask(task) {
    // Optimistic update, rolled back on failure.
    setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t._id === task._id ? { ...t, done: !t.done } : t)) }));
    try {
      await api(`/dashboard/tasks/${task._id}`, { method: 'PATCH', body: { done: !task.done } });
      toast(task.done ? 'Task reopened' : 'Task completed — nice work!');
      load();
    } catch (e) {
      setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t._id === task._id ? task : t)) }));
      toast(e.message);
    }
  }

  async function logHours(e) {
    e.preventDefault();
    try {
      const d = await api('/dashboard/hours', { method: 'POST', body: { hours: Number(hours) } });
      setData((s) => ({ ...s, weeklyHours: d.weeklyHours, stats: { ...s.stats, hoursLogged: d.weeklyHours.reduce((a, b) => a + b, 0) } }));
      setHours('');
      toast('Hours logged');
    } catch (err) { toast(err.message); }
  }

  const first = (user?.name || '').split(' ')[0];
  const nav = [
    ['home', 'Overview', true], ['tasks', 'My tasks', false, data?.tasks.filter((t) => !t.done).length],
    ['folder', 'Portfolio'], ['calendar', 'Schedule'], ['message', 'Team chat'], ['compass', 'Career coaching'],
  ];

  return (
    <div className="app">
      <aside className={`sidebar${side ? ' open' : ''}`}>
        <Logo light to="/dashboard" />
        <div>
          <div className="side-label">Menu</div>
          <nav className="side-nav">
            {nav.map(([icon, label, active, count]) => (
              <a key={label} href="#" className={active ? 'active' : ''} onClick={(e) => { e.preventDefault(); setSide(false); if (!active) toast(`${label} is coming soon`); }}>
                <Icon name={icon} />{label}{count ? <span className="count">{count}</span> : null}
              </a>
            ))}
          </nav>
        </div>
        <div>
          <div className="side-label">Account</div>
          <nav className="side-nav">
            <a href="#" onClick={(e) => { e.preventDefault(); toast('Settings are coming soon'); }}><Icon name="settings" />Settings</a>
            <button onClick={handleLogout}><Icon name="logout" />Log out</button>
          </nav>
        </div>
        <div className="side-promo">
          <strong>Book a coaching session</strong>
          <p>Get 1:1 help on your CV, LinkedIn or interview prep.</p>
          <button className="btn btn-primary btn-sm btn-block" onClick={() => toast('Coaching request sent')}>Book now</button>
        </div>
      </aside>
      <div className={`overlay${side ? ' open' : ''}`} onClick={() => setSide(false)} />

      <main className="main">
        <div className="topbar">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="icon-btn mobile-top" onClick={() => setSide(true)} aria-label="Open menu"><Icon name="menu" /></button>
            <label className="search"><Icon name="search" /><input placeholder="Search tasks, docs, people…" aria-label="Search" /></label>
          </div>
          <div className="top-actions">
            <button className="icon-btn" aria-label="Notifications" onClick={() => toast('No new notifications')}><Icon name="bell" /><span className="pip" /></button>
            <div className="user-menu" ref={menuRef}>
              <button className="user-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu">
                <span className="avatar">{initials(user?.name)}</span>
                <span className="nm">{user?.name}<span>{user?.email}</span></span>
                <Icon name="chevronDown" />
              </button>
              <div className={`dropdown${menu ? ' open' : ''}`} role="menu">
                <a href="#" onClick={(e) => { e.preventDefault(); setMenu(false); toast('Profile is coming soon'); }}><Icon name="user" />My profile</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setMenu(false); toast('Settings are coming soon'); }}><Icon name="settings" />Settings</a>
                <hr />
                <button className="danger" onClick={handleLogout}><Icon name="logout" />Log out</button>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error show" style={{ marginTop: 24 }}><Icon name="alert" />{error}</div>}
        {!data && !error && <div style={{ display: 'grid', placeItems: 'center', height: 300 }}><div className="spinner" style={{ borderColor: 'var(--teal-100)', borderTopColor: 'var(--teal-500)', width: 28, height: 28 }} /></div>}

        {data && (
          <>
            <div className="page-head">
              <div>
                <span className="eyebrow" style={{ marginBottom: 6 }}>{data.user.trackName}</span>
                <h1>Welcome back, {first}</h1>
                <p>You're in week {data.program.week} of {data.program.totalWeeks}. Here's what's happening with your team.</p>
              </div>
              <button className="btn btn-primary" onClick={() => document.getElementById('log-hours')?.focus()}><Icon name="plus" />Log hours</button>
            </div>

            <div className="grid kpis">
              <div className="panel kpi hero-kpi">
                <div className="top"><span className="k">Programme progress</span><span className="icon-tile"><Icon name="award" /></span></div>
                <div className="v">{data.program.progress}%<small> · wk {data.program.week}</small></div>
                <div className="progress"><span style={{ width: `${data.program.progress}%` }} /></div>
              </div>
              <div className="panel kpi">
                <div className="top"><span className="k">Tasks completed</span><span className="icon-tile"><Icon name="tasks" /></span></div>
                <div className="v">{data.tasks.filter((t) => t.done).length}<small> / {data.tasks.length}</small></div>
                <div className="progress"><span style={{ width: `${(data.tasks.filter((t) => t.done).length / Math.max(1, data.tasks.length)) * 100}%` }} /></div>
              </div>
              <div className="panel kpi">
                <div className="top"><span className="k">Hours logged</span><span className="icon-tile"><Icon name="clock" /></span></div>
                <div className="v">{data.stats.hoursLogged}<small>h</small></div>
                <span className="delta">▲ {data.weeklyHours.at(-1) ?? 0}h this week</span>
              </div>
              <div className="panel kpi">
                <div className="top"><span className="k">Portfolio items</span><span className="icon-tile"><Icon name="folder" /></span></div>
                <div className="v">{data.stats.portfolioItems}</div>
                <span className="muted small">{data.stats.coachingSessions} coaching sessions booked</span>
              </div>
            </div>

            <div className="grid row-2" style={{ marginTop: 20 }}>
              <div className="panel">
                <div className="panel-head">
                  <div><h3>Weekly hours</h3><span className="muted small">Time spent on team work</span></div>
                  <form onSubmit={logHours} style={{ display: 'flex', gap: 8 }}>
                    <input id="log-hours" className="input" type="number" min="0.5" max="60" step="0.5" placeholder="Hours"
                      value={hours} onChange={(e) => setHours(e.target.value)} style={{ width: 90, height: 36 }} aria-label="Hours to log" required />
                    <button className="btn btn-dark btn-sm" type="submit">Add</button>
                  </form>
                </div>
                <HoursChart data={data.weeklyHours} />
              </div>
              <div className="panel">
                <div className="panel-head"><h3>Your team lead</h3></div>
                <div className="lead-card">
                  <span className="avatar navy">{initials(data.teamLead.name)}</span>
                  <div><div className="mock-name">{data.teamLead.name}</div><div className="mock-sub">{data.teamLead.role}</div></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => toast('Message sent to your team lead')}><Icon name="message" />Message</button>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => toast('1:1 requested')}><Icon name="calendar" />Book 1:1</button>
                </div>
                <div className="panel-head" style={{ marginTop: 26, marginBottom: 6 }}><h3>Upcoming</h3></div>
                {data.events.map((ev) => (
                  <div className="event" key={ev.title}>
                    <div className="date-tile"><b>{new Date(ev.date).getDate()}</b><span>{new Date(ev.date).toLocaleDateString('en-GB', { month: 'short' })}</span></div>
                    <div className="t"><strong>{ev.title}</strong><span>{ev.meta}</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid row-2" style={{ marginTop: 20 }}>
              <div className="panel">
                <div className="panel-head">
                  <h3>This sprint</h3>
                  <span className="pill teal">{data.tasks.filter((t) => !t.done).length} open</span>
                </div>
                <div className="list">
                  {data.tasks.map((t) => (
                    <label className={`task${t.done ? ' done' : ''}`} key={t._id}>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)} />
                      <span className="t"><strong>{t.title}</strong><span>Due {fmtDay(t.due)}</span></span>
                      <span className={`pill ${TYPE_PILL[t.type] || 'navy'}`}>{t.type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-head"><h3>Your journey</h3><span className="muted small">{data.program.totalWeeks} weeks</span></div>
                <div className="milestones">
                  {data.milestones.map((m) => (
                    <div className={`ms ${m.status}`} key={m.title}>
                      <span className="b">{m.status === 'done' && <Icon name="check" strokeWidth={3} />}</span>
                      <div><strong>{m.title}</strong><span>Weeks {m.weeks[0]}{m.weeks[1] !== m.weeks[0] ? `–${m.weeks[1]}` : ''}{m.status === 'now' ? ' · in progress' : ''}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      {toastEl}
    </div>
  );
}
