'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('wp-theme');
    const prefers = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const t = saved || prefers;
    setTheme(t);
    document.documentElement.dataset.theme = t;
  }, []);

  function toggle() {
    const t = theme === 'dark' ? 'light' : 'dark';
    setTheme(t);
    localStorage.setItem('wp-theme', t);
    document.documentElement.dataset.theme = t;
  }

  return (
    <button className="btn ghost mini" onClick={toggle} title="Switch between light and dark theme">
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}