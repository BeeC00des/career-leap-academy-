import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const WEEK = 7 * 24 * 60 * 60 * 1000;

const LEADS = {
  data: { name: 'Dr. Lena Hoffmann', role: 'Senior Data Scientist · Team Lead' },
  it: { name: 'Markus Weber', role: 'Infrastructure Engineer · Team Lead' },
  product: { name: 'Sophie Bauer', role: 'Senior Product Manager · Team Lead' },
  marketing: { name: 'Jonas Richter', role: 'Growth Lead · Team Lead' },
};

// GET /api/dashboard — everything the dashboard needs in one call
router.get('/', (req, res) => {
  const u = req.user;
  const week = Math.min(u.durationWeeks, Math.max(1, Math.ceil((Date.now() - u.cohortStart.getTime()) / WEEK)));
  const done = u.tasks.filter((t) => t.done).length;
  const hours = u.weeklyHours.reduce((a, b) => a + b, 0);
  const day = 24 * 60 * 60 * 1000;

  res.json({
    user: u.toPublic(),
    program: {
      week,
      totalWeeks: u.durationWeeks,
      progress: Math.round((week / u.durationWeeks) * 100),
    },
    stats: {
      tasksDone: done,
      tasksTotal: u.tasks.length,
      hoursLogged: hours,
      portfolioItems: 2 + Math.floor(done / 2),
      coachingSessions: 3,
    },
    weeklyHours: u.weeklyHours,
    tasks: u.tasks,
    teamLead: LEADS[u.track],
    events: [
      { title: 'Sprint planning', meta: 'Team · 10:00 – 11:00', date: new Date(Date.now() + 1 * day), kind: 'team' },
      { title: 'CV & LinkedIn review', meta: 'Career coach · 14:00', date: new Date(Date.now() + 3 * day), kind: 'coaching' },
      { title: 'Mock interview (German market)', meta: 'Career coach · 16:30', date: new Date(Date.now() + 8 * day), kind: 'coaching' },
    ],
    milestones: [
      { title: 'Onboarding & team intro', weeks: [1, 1] },
      { title: 'First sprint delivered', weeks: [2, 4] },
      { title: 'Portfolio project in progress', weeks: [5, 10] },
      { title: 'Coaching: CV, LinkedIn & interviews', weeks: [11, 14] },
      { title: 'Apply with references', weeks: [15, 16] },
    ].map((m) => ({ title: m.title, status: week > m.weeks[1] ? 'done' : week >= m.weeks[0] ? 'now' : 'next', weeks: m.weeks })),
  });
});

// PATCH /api/dashboard/tasks/:id — toggle a task's done state
router.patch('/tasks/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Task not found' });
    const task = req.user.tasks.id(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.done = typeof req.body?.done === 'boolean' ? req.body.done : !task.done;
    await req.user.save();
    res.json({ task });
  } catch (err) { next(err); }
});

// POST /api/dashboard/hours — log hours for the current week
router.post('/hours', async (req, res, next) => {
  try {
    const h = Number(req.body?.hours);
    if (!Number.isFinite(h) || h <= 0 || h > 60) return res.status(400).json({ message: 'Hours must be between 0 and 60' });
    const arr = req.user.weeklyHours;
    if (arr.length) arr[arr.length - 1] += h; else arr.push(h);
    req.user.markModified('weeklyHours');
    await req.user.save();
    res.json({ weeklyHours: req.user.weeklyHours });
  } catch (err) { next(err); }
});

export default router;
