import { useEffect, useRef } from 'react';
import { pad } from '../utils/dates';

const ITEM = 36; // px, must match .wheel-item height in the CSS
const HOURS = Array.from({ length: 12 }, (_, i) => pad(i + 1));
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5));
const AMPM = ['AM', 'PM'];

function Column({ items, value, onChange }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  const idx = Math.max(0, items.indexOf(value));

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
        <div key={it} className={`wheel-item ${it === value ? 'on' : ''}`} onClick={() => onChange(it)}>
          {it}
        </div>
      ))}
      <div className="wheel-pad" />
    </div>
  );
}

export default function TimeWheel({ value, onChange, label }) {
  const [h24, m] = value.split(':').map(Number);
  const hour = pad(h24 % 12 || 12);
  const min = pad(m);
  const ap = h24 >= 12 ? 'PM' : 'AM';

  const emit = (hh, mm, a) => {
    const h = (Number(hh) % 12) + (a === 'PM' ? 12 : 0);
    onChange(`${pad(h)}:${mm}`);
  };

  return (
    <div className="wheel">
      {label && <span className="wheel-label">{label}</span>}
      <div className="wheel-box">
        <Column items={HOURS} value={hour} onChange={(v) => emit(v, min, ap)} />
        <span className="wheel-colon">:</span>
        <Column items={MINUTES} value={min} onChange={(v) => emit(hour, v, ap)} />
        <Column items={AMPM} value={ap} onChange={(v) => emit(hour, min, v)} />
        <div className="wheel-band" />
      </div>
    </div>
  );
}