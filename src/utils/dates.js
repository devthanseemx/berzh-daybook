export const pad = (n) => String(n).padStart(2, '0');
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => toKey(new Date());
export const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
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