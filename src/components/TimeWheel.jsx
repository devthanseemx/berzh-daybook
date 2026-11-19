import { useEffect, useRef } from 'react';

const ITEM = 36; // px, must match .wheel-item height in the CSS
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function Column({ items, value, onChange }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  const idx = Math.max(0, items.indexOf(value));

  // keep the scroll position in sync with the value
  useEffect(() => {
    const el = ref.current;
    if (el && Math.round(el.scrollTop / ITEM) !== idx) el.scrollTop = idx * ITEM;
  }, [idx]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onScroll = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM)));
      if (items[i] !== latest.current.value) latest.current.onChange(items[i]);
    }, 80);
  };

  return (
    <div className="wheel-col" ref={ref} onScroll={onScroll}>
      <div className="wheel-pad" />
      {items.map((it) => (
        <div
          key={it}
          className={`wheel-item ${it === value ? 'on' : ''}`}
          onClick={() => onChange(it)}
        >
          {it}
        </div>
      ))}
      <div className="wheel-pad" />
    </div>
  );
}

export default function TimeWheel({ value, onChange, label }) {
  const [h, m] = value.split(':');
  return (
    <div className="wheel">
      {label && <span className="wheel-label">{label}</span>}
      <div className="wheel-box">
        <Column items={HOURS} value={h} onChange={(nh) => onChange(`${nh}:${m}`)} />
        <span className="wheel-colon">:</span>
        <Column items={MINUTES} value={m} onChange={(nm) => onChange(`${h}:${nm}`)} />
        <div className="wheel-band" />
      </div>
    </div>
  );
}