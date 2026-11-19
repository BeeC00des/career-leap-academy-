// Starter data so a new participant's dashboard isn't empty.
const DAY = 24 * 60 * 60 * 1000;
const inDays = (n) => new Date(Date.now() + n * DAY);

const TASKS = {
  data: [
    ['Clean the Q3 customer dataset with pandas', 'Sprint task'],
    ['Write precision & recall summary for the churn model', 'Sprint task'],
    ['Build a KPI dashboard draft in Power BI', 'Deliverable'],
    ['Peer review: teammate notebook', 'Review'],
  ],
  it: [
    ['Set up Git workflow for the infra repo', 'Sprint task'],
    ['Security hygiene audit: user accounts & MFA', 'Sprint task'],
    ['Document the deployment checklist', 'Deliverable'],
    ['Peer review: teammate runbook', 'Review'],
  ],
  product: [
    ['Write user stories for onboarding v2', 'Sprint task'],
    ['Groom the backlog with acceptance criteria', 'Sprint task'],
    ['Facilitate the sprint retro', 'Deliverable'],
    ['Peer review: teammate PRD', 'Review'],
  ],
  marketing: [
    ['Run 3 user-research interviews', 'Sprint task'],
    ['Draft landing-page copy variants', 'Sprint task'],
    ['Community growth plan for LinkedIn', 'Deliverable'],
    ['Peer review: teammate campaign brief', 'Review'],
  ],
};

const COMMON = [
  ['Update CV with simulation project outcomes', 'Coaching'],
  ['Optimise LinkedIn headline & About section', 'Coaching'],
];

export function starterTasks(track) {
  const list = [...(TASKS[track] || TASKS.data), ...COMMON];
  return list.map(([title, type], i) => ({ title, type, due: inDays(i + 1), done: i === 0 || i === 4 }));
}

export function starterHours() {
  return [6, 9, 11, 14, 13];
}
