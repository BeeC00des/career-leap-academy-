# CareerLeap V1 — New UI & Functionality

A rebuild of [career-leap.academy](https://www.career-leap.academy/) as a **MERN** application (MongoDB, Express, React, Node). It includes:

- A marketing **landing page** using the content from the current site.
- **Authentication**: register, log in, log out, forgot password and reset password.
- A participant **dashboard**.

---

## 1. Quick start

```bash
# from the project root
npm run install:all        # installs root, server and client dependencies
cp server/.env.example server/.env   # optional in development
npm run dev                # API on :5000 and React on :5173
```

Open **http://localhost:5173**.

- **No MongoDB installed?** Leave `MONGO_URI` empty. In development the API starts an **in-memory MongoDB** automatically. The data resets every time the server restarts.
- **No SMTP configured?** Password-reset links are printed in the server console. The Forgot Password page also shows an "open the reset link" shortcut, in development only.

### Production (Vercel + Render + MongoDB Atlas)

```
Browser ──► Vercel (client/dist)  ──/api/* rewrite──►  Render (server/)  ──►  MongoDB Atlas
```

Vercel forwards `/api/*` to Render ([client/vercel.json](client/vercel.json)), so the browser only ever talks to the Vercel domain. The auth cookie stays first-party, and no CORS setup is needed.

1. **MongoDB Atlas:** create a cluster and a database user. Under Network Access allow `0.0.0.0/0`, because Render's free plan has no fixed outbound IPs. Copy the `mongodb+srv://…/careerleap` connection string.
2. **Render:** push the repo to GitHub, then choose New → Blueprint and select the repo. This reads [render.yaml](render.yaml).
   - When asked, fill in `MONGO_URI`, `CLIENT_URL` (your Vercel URL) and the `SMTP_*` values.
   - `JWT_SECRET` is generated automatically.
3. **Vercel:** create a new project with Root Directory `client`. The framework is detected as Vite.
   - If your Render URL isn't `https://careerleap-api-rvc2.onrender.com`, edit the destination in `client/vercel.json`.
4. Set `CLIENT_URL` on Render to the final Vercel domain. Password-reset emails link to it.

**Notes:**

- In production `MONGO_URI` and `JWT_SECRET` are required, and the server refuses to start without them.
- `TRUST_PROXY=2` (Vercel plus Render's load balancer) makes `req.ip` the real visitor, so the login rate limiter counts per user.
- Single-host alternative: run `npm run build` and then `npm start`. Express serves `client/dist` itself when it exists.

---

## 2. Architecture

```
┌──────────────────────────── Browser ────────────────────────────┐
│  React 18 SPA (Vite) + React Router                             │
│  AuthContext ──► api.js (fetch, credentials: 'include')         │
└───────────────────────────────┬─────────────────────────────────┘
                                │  /api/*  (same origin; Vite proxy in dev)
                                │  JWT in httpOnly cookie "cl_token"
┌───────────────────────────────▼─────────────────────────────────┐
│  Express 4 (Node 20+)                                           │
│  helmet · express.json · cookie-parser · express-rate-limit     │
│  /api/auth/*       routes/auth.js                               │
│  /api/dashboard/*  routes/dashboard.js  (requireAuth)           │
│  prod: serves client/dist + SPA fallback                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Mongoose 8
┌───────────────────────────────▼─────────────────────────────────┐
│  MongoDB (Atlas / local) — or mongodb-memory-server in dev      │
│  users collection (embedded tasks + weeklyHours)                │
└─────────────────────────────────────────────────────────────────┘
                 Nodemailer → SMTP (password-reset emails)
```

### Folder structure

```
Career-leap-V1/
├── package.json                 # root scripts (dev runs both apps with concurrently)
├── New UI and functionality.md  # this document
├── server/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── index.js             # app bootstrap, middleware, error handler, static hosting
│       ├── config/db.js         # Mongo connection (+ in-memory fallback in dev)
│       ├── models/User.js       # schema, bcrypt hashing, reset-token helpers, TRACKS
│       ├── middleware/auth.js   # signToken, cookie options, requireAuth
│       ├── routes/auth.js       # register / login / logout / me / forgot / reset
│       ├── routes/dashboard.js  # dashboard payload, toggle task, log hours
│       └── utils/
│           ├── email.js         # Nodemailer (console fallback)
│           └── seed.js          # starter tasks per track for new users
└── client/
    ├── index.html               # Inter font, favicon, meta
    ├── vite.config.js           # /api proxy → :5000
    └── src/
        ├── main.jsx             # BrowserRouter + AuthProvider
        ├── App.jsx              # route table
        ├── api.js               # fetch wrapper (throws Error with server message)
        ├── styles.css           # the whole design system (tokens + components)
        ├── context/AuthContext.jsx
        ├── data/content.js      # marketing copy (tracks, steps, testimonials…)
        ├── components/
        │   ├── RouteGuards.jsx  # ProtectedRoute / GuestRoute
        │   ├── AuthLayout.jsx   # split-screen auth shell
        │   ├── FormBits.jsx     # PasswordInput, PasswordMeter, Alert, SubmitButton
        │   ├── Icon.jsx         # inline SVG icon set
        │   └── Logo.jsx
        └── pages/
            ├── Landing.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── ForgotPassword.jsx
            ├── ResetPassword.jsx
            └── Dashboard.jsx
```

### Routes (client)

| Path | Access | Page |
|---|---|---|
| `/` | public | Landing page |
| `/login` | guests only | Log in (redirects to `/dashboard` if already signed in) |
| `/register` | guests only | Create account. Accepts `?email=` and `?track=` from landing CTAs |
| `/forgot-password` | guests only | Request a reset link |
| `/reset-password?token=…` | public | Set a new password |
| `/dashboard` | signed-in only | Participant dashboard (redirects to `/login`, then returns here) |
| `*` | — | Redirects to `/` |

---

## 3. API reference

All responses are JSON. Errors have the shape `{ "message": "…" }`.

### Auth: `/api/auth`

| Method | Endpoint | Body | Result |
|---|---|---|---|
| POST | `/register` | `name, email, password (8+), track?` | 201 `{ user }` and sets the session cookie. 409 if the email is taken |
| POST | `/login` | `email, password` | `{ user }` and sets the cookie. 401 `Incorrect email or password` |
| POST | `/logout` | — | Clears the cookie |
| GET | `/me` | — | `{ user }` or 401. Used to restore the session on page load |
| POST | `/forgot-password` | `email` | Always returns the same generic message. In dev without SMTP it also returns `devResetUrl` |
| POST | `/reset-password` | `token, password` | Sets the new password and clears the token. 400 if the token is invalid or expired |

`track` is one of `data | it | product | marketing`.

### Dashboard: `/api/dashboard` (authentication required)

| Method | Endpoint | Body | Result |
|---|---|---|---|
| GET | `/` | — | `{ user, program, stats, weeklyHours, tasks, teamLead, events, milestones }` |
| PATCH | `/tasks/:id` | `done?: boolean` | Toggles or sets a task. Returns `{ task }` |
| POST | `/hours` | `hours (0–60)` | Adds hours to the current week. Returns `{ weeklyHours }` |

`GET /api/health` returns `{ ok: true }`.

---

## 4. Data model

**User** (`users` collection)

| Field | Type | Notes |
|---|---|---|
| name | String | required, max 80 |
| email | String | unique, lowercase |
| password | String | bcrypt (12 rounds), `select: false` |
| track | enum | `data`, `it`, `product`, `marketing` |
| cohortStart | Date | Set 5 weeks in the past for demo data |
| durationWeeks | Number | default 16 |
| tasks | [{ title, type, due, done }] | Seeded per track on registration (`utils/seed.js`) |
| weeklyHours | [Number] | Hours per programme week |
| passwordChangedAt | Date | Used to invalidate older JWTs |
| resetPasswordToken | String | SHA-256 hash of the emailed token, `select: false` |
| resetPasswordExpires | Date | 1 hour after it is issued |

Team lead, events and milestones are currently computed in `routes/dashboard.js`. They are the natural next things to move into their own collections (`cohorts`, `teams`, `events`).

---

## 5. Authentication and security design

- **Session:** a JWT (`sub` = user id, 7-day expiry) stored in an **httpOnly, SameSite=Lax** cookie (`cl_token`). The cookie is `Secure` in production. JavaScript can't read the token, which removes the usual localStorage XSS token-theft risk.
- **Same origin:** Vite proxies `/api` in development, and Vercel rewrites `/api/*` to Render in production. This avoids CORS and third-party-cookie issues.
- **Passwords:** hashed with bcrypt (cost 12). They are never returned, because the field is `select: false`.
- **Forgot password:**
  - Sends back a generic response, so it doesn't reveal which emails have accounts.
  - Only the SHA-256 **hash** of the token is stored.
  - Tokens are single-use and expire after **1 hour**.
- **Reset password:**
  - Sets `passwordChangedAt`. `requireAuth` then rejects any JWT issued before that time, so a reset logs out every other session.
  - Clears the token and the cookie.
- **Logout:** clears the cookie on the server, and the client clears its auth state.
- **Hardening:**
  - `helmet` security headers.
  - JSON body limit of 50 kb.
  - `express-rate-limit` allows 20 requests per 15 minutes per IP on the register, login, forgot and reset endpoints.
  - Server-side validation of every input.
  - Mongo duplicate-key errors are mapped to a 409.
- **Client guards:**
  - `ProtectedRoute` waits for `/me` before deciding, so there's no flash of protected content.
  - `GuestRoute` keeps signed-in users away from the auth pages.

---

## 6. Design system

All tokens live at the top of `client/src/styles.css`.

| Token | Value | Use |
|---|---|---|
| `--navy-800` | `#06364a` | Dark band, CTA, sidebar, primary dark buttons |
| `--teal-500` | `#2b8f9b` | Primary buttons, accents, eyebrows, charts |
| `--teal-50 / 100` | `#eef7f8 / #dceff1` | Icon tiles, focus rings, info alerts |
| `--bg` | `#f4f8f9` | Page background |
| `--surface` | `#ffffff` | Cards |
| `--line` | `#e3eaee` | Borders and dividers |
| Font | Inter 400/500/600/700 | Tight negative tracking on headings |
| Radius | 8 / 12 / 18 / 24 px | Inputs, small cards, cards, hero cards |

**Patterns taken from the reference:**

- **Hero:** a headline and email capture on the left, layered "product" cards on the right, and faint diagonal shapes in the background.
- **Overlapping white feature card:** sits across the hero and next section. It has an eyebrow, a two-column heading and a description, and a 4-column icon row (the four tracks).
- **Bento "Why" grid:**
  - A big teal stat.
  - A flow illustration.
  - A wide card with a chart that sits flush on the bottom edge.
- **Dark navy "steps" band:** numbered cards whose large numerals fade out.
- **Choose-plan tiles → track cards:** one featured teal card and three light cards, with an arrow that rotates on hover.
- **Rounded navy CTA block:** paired primary and ghost buttons.
- **Footer:** a four-column footer with social icons.

**Responsive breakpoints:**

| Width | Changes |
|---|---|
| 1100px | Grids drop to 2 columns |
| 900px | Mobile nav, hero stacks, the auth side panel is hidden, and the sidebar becomes an off-canvas drawer |
| 600px | Everything is a single column |

Reveal animations respect `prefers-reduced-motion`.

---

## 7. Pages and functionality

### Landing (`/`)

Content comes from career-leap.academy and lives in `client/src/data/content.js`. The page sections are:

1. **Nav:** How it works, Why CareerLeap, Career Tracks, Stories. Log in / Get started, or "Go to dashboard" when signed in.
2. **Hero:** "Learn on the job. Before the job."
   - The email capture leads to `/register?email=…`.
   - Badges: 3–6 months · Real team tasks · German market focus.
3. **Feature card:** "Not a bootcamp", showing the four simulation teams.
4. **Why CareerLeap bento:** 4 teams, the team-lead flow and career coaching.
5. **How the simulation works:** four steps.
6. **Choose your team:** stats, then four track cards with skill tags. Each card links to `/register?track=…`.
7. **Why this is different:**
   - Real company structure.
   - Industry leads.
   - German market focus.
   - Portfolio and references.
8. **Participant stories:** Deborah, Prince, Angela and a volunteer.
9. **CTA:** Apply now, or book an info session (Calendly).
10. **Footer:**
    - Programmes.
    - Company.
    - Support (Help Center, Privacy, Cookie Policy, Impressum).
    - Social links.

### Auth pages

All of them share `AuthLayout`: a navy brand panel with a testimonial on the left and the form on the right. Features include:

- Show/hide password.
- A password-strength meter on register and reset.
- A live "passwords match" check.
- Loading spinners.
- Server error messages shown in alerts.
- A success notice on the login page after a reset or logout.

### Dashboard (`/dashboard`)

| Area | What it does |
|---|---|
| **Sidebar** | Overview, My tasks (with an open-task count), Portfolio, Schedule, Team chat, Career coaching, Settings, **Log out**, and a "Book a coaching session" promo. On mobile it is an off-canvas drawer |
| **Top bar** | Search, notifications, and a user menu (profile, settings, **log out**) |
| **KPIs** | Programme progress (teal hero card), tasks completed, hours logged, portfolio items |
| **Weekly hours chart** | SVG area chart with hover tooltips. The inline "Log hours" form saves to `POST /hours` |
| **Team lead** | Lead for the user's track, plus Message and Book 1:1 buttons |
| **Upcoming events** | Next three sessions |
| **This sprint** | Track-specific task list. Checkboxes update instantly and call `PATCH /tasks/:id`, rolling back if the call fails |
| **Your journey** | 16-week milestone timeline, with done / in-progress / next states derived from the cohort week |

---

## 8. Verification done

- **API smoke test:** all of these behaved as expected on the in-memory database:
  - Register.
  - Duplicate-email rejection.
  - `/me`.
  - Dashboard payload.
  - Toggling a task.
  - Logging hours.
  - Logout (then `/me` returns 401).
  - Wrong password.
  - Forgot password, with both an unknown and a known email.
  - Reset password.
  - Reusing a reset token is rejected.
  - Old password is rejected and the new password works.
- **Client:** the production build (`vite build`) succeeds with no errors.
- **Not yet done:** a manual visual pass in a browser. Run `npm run dev` and click through each page.

---

## 9. Placeholders and next steps

**Content to replace with real values:**

- The **Calendly URL** (`CALENDLY` in `Landing.jsx`).
- The **social and footer links**, which point to `#`.
- The **testimonial quotes**. They are short paraphrases of the stories on the current site; swap in the exact wording.
- The **dashboard sample data**:
  - Team-lead names.
  - Events.
  - Starter tasks.
  - A cohort start set 5 weeks in the past.

**Features still to build:**

- Sidebar items other than Overview (Portfolio, Schedule, Team chat, Coaching, Settings, Profile) show a "coming soon" toast.
- Email verification on sign-up.
- Admin and team-lead roles (`role` field plus middleware).
- Separate `cohorts`, `teams` and `events` collections.
- The German cookie-consent banner from the current site.
- Tests:
  - API with Jest + Supertest using mongodb-memory-server.
  - UI with Playwright.
