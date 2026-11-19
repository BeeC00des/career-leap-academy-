import { Router } from 'express';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import User, { TRACKS } from '../models/User.js';
import { COOKIE_NAME, cookieOptions, requireAuth, signToken } from '../middleware/auth.js';
import { sendResetEmail } from '../utils/email.js';
import { starterTasks, starterHours } from '../utils/seed.js';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setSession(res, user) {
  res.cookie(COOKIE_NAME, signToken(user._id), cookieOptions());
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password, track } = req.body || {};
    if (!name?.trim() || !EMAIL_RE.test(email || '') || (password || '').length < 8) {
      return res.status(400).json({ message: 'Name, a valid email and a password of 8+ characters are required' });
    }
    if (track && !TRACKS[track]) return res.status(400).json({ message: 'Unknown career track' });

    const exists = await User.exists({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists' });

    const t = track || 'data';
    const user = await User.create({
      name, email, password, track: t,
      cohortStart: new Date(Date.now() - 5 * 7 * 24 * 60 * 60 * 1000), // demo: 5 weeks into the cohort
      tasks: starterTasks(t),
      weeklyHours: starterHours(),
    });
    setSession(res, user);
    res.status(201).json({ user: user.toPublic() });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password || ''))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }
    setSession(res, user);
    res.json({ user: user.toPublic() });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const email = (req.body?.email || '').toLowerCase();
    const generic = { message: 'If an account exists for that email, a reset link has been sent.' };
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });

    const user = await User.findOne({ email });
    if (!user) return res.json(generic); // never reveal whether the email exists

    const raw = user.createResetToken();
    await user.save({ validateBeforeSave: false });

    const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${raw}`;
    await sendResetEmail(user.email, user.name, url);

    // Development convenience only: expose the link so the flow can be tested without SMTP.
    if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
      return res.json({ ...generic, devResetUrl: url });
    }
    res.json(generic);
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token || (password || '').length < 8) {
      return res.status(400).json({ message: 'A valid token and a password of 8+ characters are required' });
    }
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
    res.json({ message: 'Password updated. You can now log in.' });
  } catch (err) { next(err); }
});

export default router;
