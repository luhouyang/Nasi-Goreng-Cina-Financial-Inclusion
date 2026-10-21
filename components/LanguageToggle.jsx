"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { LANGUAGES, LANG_KEY, getSavedLang } from "@/lib/lang";
import { LANG_EVENT } from "@/lib/i18n";

export default function LanguageToggle() {
  const [lang, setLang] = useState(null);

  useEffect(() => {
    const saved = getSavedLang();
    setLang(saved);
    document.documentElement.lang = saved;
  }, []);

  function change(e) {
    const next = e.target.value;
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {}
    setLang(next);
    document.documentElement.lang = next;
    window.dispatchEvent(new Event(LANG_EVENT));
  }

  return (
    <label className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 text-stone-600 focus-within:ring-2 focus-within:ring-wood-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
      <Languages size={16} strokeWidth={1.8} aria-hidden="true" />
      <span className="sr-only">Plan language</span>
      <select
        value={lang ?? "en"}
        disabled={lang === null}
        onChange={change}
        title="Language for new plans"
        className="cursor-pointer bg-transparent text-xs font-semibold outline-none disabled:opacity-50"
      >
        {Object.entries(LANGUAGES).map(([code, l]) => (
          <option key={code} value={code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
