const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const uid = () => crypto.randomUUID();
const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));

const validDate = (s) => {
  if (typeof s !== 'string' || !DATE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

export const FIELDS = [
  ['events', 'date', 'required', 'YYYY-MM-DD, e.g. "2026-12-01"'],
  ['events', 'title', 'required', 'text'],
  ['events', 'category', 'optional', 'Job application, Interview, Meeting, Personal or Other (default Other)'],
  ['events', 'company, jobTitle, salary, description, nextSteps, notes', 'optional', 'text'],
  ['tasks', 'date', 'required', 'YYYY-MM-DD'],
  ['tasks', 'title', 'required', 'text'],
  ['tasks', 'start, end', 'required', '24-hour "HH:MM", e.g. "14:30". end must be later than start'],
  ['tasks', 'done', 'optional', 'true or false (default false)'],
  ['tasks', 'subtasks', 'optional', 'list of text, or list of { "title": "...", "done": true/false }'],
  ['templates', 'title', 'required', 'text'],
  ['templates', 'start, end', 'required', '24-hour "HH:MM"'],
  ['templates', 'subtasks', 'optional', 'list of text'],
];

export const EXAMPLE = {
  events: [
    {
      date: '2026-12-01',
      title: 'Applied: Frontend Developer at Acme',
      category: 'Job application',
      company: 'Acme Corp',
      jobTitle: 'Frontend Developer',
      salary: '$70k–$85k per year',
      description: 'Build and maintain React dashboards for logistics customers.',
      nextSteps: 'Follow up in 1 week; prepare portfolio',
      notes: 'Applied through the careers page',
    },
    { date: '2026-11-10', title: 'Phone screen with recruiter', category: 'Interview', notes: 'Went well' },
  ],
  tasks: [
    {
      date: '2026-12-02',
      start: '09:00',
      end: '10:30',
      title: 'Prepare for interview',
      done: false,
      subtasks: [{ title: 'Review React hooks', done: false }, 'Practice common questions'],
    },
    { date: '2026-12-02', start: '14:00', end: '15:00', title: 'Gym' },
  ],
  templates: [
    { title: 'Morning routine', start: '06:30', end: '07:15', subtasks: ['Stretch', 'Plan the day'] },
  ],
};

export function parseImport(text) {
  const errors = [];
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { errors: [`Not valid JSON: ${e.message}`] };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { errors: ['Top level must be an object like { "events": [], "tasks": [], "templates": [] }'] };
  }

  const out = { events: [], tasks: [], templates: [] };
  const list = (key) => {
    if (raw[key] == null) return [];
    if (!Array.isArray(raw[key])) {
      errors.push(`"${key}" must be a list ([ ... ])`);
      return [];
    }
    return raw[key];
  };
  const subs = (v, p) => {
    if (v == null) return [];
    if (!Array.isArray(v)) {
      errors.push(`${p}: "subtasks" must be a list`);
      return [];
    }
    return v
      .map((s) =>
        typeof s === 'string'
          ? { id: uid(), title: s.trim(), done: false }
          : { id: uid(), title: str(s?.title), done: Boolean(s?.done) }
      )
      .filter((s) => s.title);
  };

  list('events').forEach((e, i) => {
    const p = `events[${i}]`;
    if (!e || typeof e !== 'object') return errors.push(`${p}: must be an object`);
    if (!validDate(e.date)) return errors.push(`${p}: "date" must be a real date as YYYY-MM-DD`);
    if (!str(e.title)) return errors.push(`${p}: "title" is required`);
    out.events.push({
      id: uid(), date: e.date, title: str(e.title), category: str(e.category) || 'Other',
      company: str(e.company), jobTitle: str(e.jobTitle), salary: str(e.salary),
      description: str(e.description), nextSteps: str(e.nextSteps), notes: str(e.notes),
    });
  });

  list('tasks').forEach((t, i) => {
    const p = `tasks[${i}]`;
    if (!t || typeof t !== 'object') return errors.push(`${p}: must be an object`);
    if (!validDate(t.date)) return errors.push(`${p}: "date" must be a real date as YYYY-MM-DD`);
    if (!str(t.title)) return errors.push(`${p}: "title" is required`);
    if (!TIME.test(t.start || '') || !TIME.test(t.end || ''))
      return errors.push(`${p}: "start" and "end" must be 24-hour HH:MM, e.g. "14:30"`);
    if (t.end <= t.start) return errors.push(`${p}: "end" must be later than "start"`);
    out.tasks.push({
      id: uid(), date: t.date, start: t.start, end: t.end, title: str(t.title),
      done: Boolean(t.done), subtasks: subs(t.subtasks, p),
    });
  });

  list('templates').forEach((t, i) => {
    const p = `templates[${i}]`;
    if (!t || typeof t !== 'object') return errors.push(`${p}: must be an object`);
    if (!str(t.title)) return errors.push(`${p}: "title" is required`);
    if (!TIME.test(t.start || '') || !TIME.test(t.end || ''))
      return errors.push(`${p}: "start" and "end" must be 24-hour HH:MM`);
    out.templates.push({
      id: uid(), title: str(t.title), start: t.start, end: t.end,
      subtasks: subs(t.subtasks, p).map((s) => s.title),
    });
  });

  return { data: out, errors };
}