import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/notify';

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

const logErr = ({ error }) => {
  if (!error) return;
  console.error('Supabase error:', error.message);
  notify.error(`Could not sync with Supabase: ${error.message}`);
};

export default function useCollection(name, userId) {
  const cloud = Boolean(supabase && userId);
  const lsKey = `daybook.${name}`;
  const [items, setItems] = useState(() => (cloud ? [] : read(lsKey)));
  const [ready, setReady] = useState(!cloud);

  // load from Supabase
  useEffect(() => {
    if (!cloud) return;
    let cancelled = false;
    supabase.from(name).select('data').then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
  console.error(`Loading ${name} failed:`, error.message);
  notify.error(`Could not load ${name}: ${error.message}`);
}
      else setItems(data.map((r) => r.data));
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [cloud, name]);

  // browser-only fallback
  useEffect(() => {
    if (cloud) return;
    try {
      localStorage.setItem(lsKey, JSON.stringify(items));
    } catch { /* storage full or blocked */ }
  }, [items, cloud, lsKey]);

  const save = useCallback((item) => {
    setItems((l) => (l.some((x) => x.id === item.id) ? l.map((x) => (x.id === item.id ? item : x)) : [...l, item]));
    if (cloud) supabase.from(name).upsert({ id: item.id, data: item }).then(logErr);
  }, [cloud, name]);

  const saveMany = useCallback((list) => {
    if (!list.length) return;
    setItems((l) => {
      const map = new Map(l.map((x) => [x.id, x]));
      list.forEach((x) => map.set(x.id, x));
      return [...map.values()];
    });
    if (cloud) supabase.from(name).upsert(list.map((x) => ({ id: x.id, data: x }))).then(logErr);
  }, [cloud, name]);

  const remove = useCallback((id) => {
    setItems((l) => l.filter((x) => x.id !== id));
    if (cloud) supabase.from(name).delete().eq('id', id).then(logErr);
  }, [cloud, name]);

  return [items, { save, saveMany, remove }, ready];
}