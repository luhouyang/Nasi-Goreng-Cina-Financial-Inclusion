// Output languages for AI-generated plans.
export const LANGUAGES = {
  en: { label: "EN", name: "English" },
  ms: { label: "BM", name: "Bahasa Malaysia" },
  zh: { label: "中文", name: "Simplified Chinese" },
  ta: { label: "தமிழ்", name: "Tamil" },
};

export const LANG_KEY = "wp-lang";

// Extra instruction appended to every agent's system prompt.
// JSON keys stay in English so the editor blocks keep working.
export function langInstruction(lang) {
  const l = LANGUAGES[lang];
  if (!l || lang === "en") return "";
  return ` Write all human-readable text in ${l.name}. Keep JSON keys, URLs, company names and numbers unchanged.`;
}

// Client-side helper: read the saved choice (defaults to English).
export function getSavedLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return LANGUAGES[v] ? v : "en";
  } catch {
    return "en";
  }
}
