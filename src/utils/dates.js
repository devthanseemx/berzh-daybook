export const pad = (n) => String(n).padStart(2, '0');
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => toKey(new Date());
export const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const getTaskDates = (range, selectedKey, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const shift = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  let start;
  let end;

  if (range === 'selected') {
    start = end = fromKey(selectedKey);
  } else if (range === 'today') {
    start = end = today;
  } else if (range === 'tomorrow') {
    start = end = shift(today, 1);
  } else if (range === 'next7') {
    start = today;
    end = shift(today, 6);
  } else if (range === 'nextWeek') {
    start = shift(today, 8 - (today.getDay() || 7));
    end = shift(start, 6);
  } else if (range === 'nextMonth') {
    start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  } else if (range === 'nextYear') {
    start = new Date(today.getFullYear() + 1, 0, 1);
    end = new Date(today.getFullYear() + 2, 0, 0);
  } else {
    throw new Error(`Unknown task date range: ${range}`);
  }

  const dates = [];
  for (let date = start; date <= end; date = shift(date, 1)) dates.push(toKey(date));
  return dates;
};
export const prettyDate = (k) =>
  fromKey(k).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
export const shortDate = (k) =>
  fromKey(k).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

// 42 cells (6 weeks) starting on the Sunday before the 1st
export const monthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
};

// "14:30" -> "2:30 PM"
export const fmt12 = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
};