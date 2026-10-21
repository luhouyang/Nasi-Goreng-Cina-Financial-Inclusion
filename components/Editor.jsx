"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Download,
  Printer,
  Terminal,
  Plus,
  FileText,
  Lightbulb,
  Link2,
  ListTodo,
  Pencil,
  Trash2,
  LoaderCircle,
  Check,
  Copy,
  Search,
  Compass,
  Swords,
  LayoutGrid,
  ShieldCheck,
  Mail,
  ListChecks,
  ChevronDown,
  ChartNoAxesCombined,
  Globe2,
  BookOpen,
  CircleAlert,
  ExternalLink,
  UserRound,
  Clock3,
  Scale,
  Target,
  Radio,
  X,
} from "lucide-react";
import { uid } from "@/lib/blocks";
import { blocksToMarkdown, download, exportWord } from "@/lib/export";
import { ForecastCharts } from "@/components/Charts";
import AgentSidebar from "@/components/AgentSidebar";
import { getSavedLang } from "@/lib/lang";

const INPUT =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-wood-500 focus:ring-2 focus:ring-wood-500/10 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500";
const BUTTON =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800";
const PRIMARY =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-wood-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-wood-600 disabled:cursor-not-allowed disabled:opacity-50";
const PANEL =
  "rounded-xl border border-stone-200 bg-white p-4 text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100";
const MUTED = "text-xs leading-relaxed text-stone-500 dark:text-stone-400";
const PILL =
  "inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300";
const ACTION_ICONS = {
  "idea.research": Search,
  "idea.swot": Compass,
  "idea.porter": Swords,
  "idea.bmc": LayoutGrid,
  "ref.verify": ShieldCheck,
  "ref.summarize": FileText,
  "action.draft": Mail,
  "action.steps": ListChecks,
};
const TASKS = {
  "idea.research": (b) =>
    `Research market, competitors and demand for: "${b.text}". Name real companies. Return JSON: {"summary": "", "steps": [{"text": "", "owner": "", "timing": ""}]}`,
  "idea.expand": (b) =>
    `Expand this idea into a concrete mini-plan: "${b.text}". Return JSON: {"positioning": "", "customers": "", "pricing": "", "first_90_days": ["", "", ""]}`,
  "idea.swot": (b) =>
    `Produce a SWOT analysis for: "${b.text}". Return JSON only: {"strengths":[],"weaknesses":[],"opportunities":[],"threats":[]}`,
  "idea.porter": (b) =>
    `Score Porter's Five Forces (1=low, 5=high) for: "${b.text}". Return JSON only: {"rivalry":{"score":3,"note":""},"supplier_power":{"score":3,"note":""},"buyer_power":{"score":3,"note":""},"threat_of_entry":{"score":3,"note":""},"threat_of_substitution":{"score":3,"note":""}}`,
  "idea.bmc": (b) =>
    `Fill a Business Model Canvas for: "${b.text}". Return JSON only with string keys: segments,value,channels,relationships,revenue,resources,activities,partners,costs`,
  "ref.verify": (b) =>
    `Verify and fact-check this source/claim: "${b.text}" — ${(b.meta?.quote || "").slice(0, 600)}. Return JSON: {"verdict": "", "notes": ""}`,
  "ref.summarize": (b) =>
    `Summarize key actionable points: "${b.text}" — ${(b.meta?.quote || "").slice(0, 600)}. Return JSON: {"summary": "", "actions": ["", ""]}`,
  "action.draft": (b) =>
    `Draft a short, human-friendly professional outreach email to ${b.meta?.target || "the relevant party"} for: "${b.text}". ${b.meta?.detail || ""}. Return JSON only: {"subject": "Direct subject line", "body": "Professional plain text body with line breaks. No markdown."}. No conversational filler.`,
  "action.steps": (b) =>
    `Break this action into a practical, human-friendly step-by-step checklist. Action: "${b.text}". Target: ${b.meta?.target || "n/a"}. ${b.meta?.detail || ""}. Return JSON ONLY: {"steps": [{"text": "Clear, direct action step (no markdown, no bolding)", "owner": "Role/Person", "timing": "Timeline", "cost": "Estimated cost", "legal": "Legal precaution", "links": ["https://..."]}]} Keep it to 4-6 steps max.`,
};
const FRAMEWORK_BLOCK = {
  "idea.swot": "swot",
  "idea.porter": "porter",
  "idea.bmc": "bmc",
};
const FRAMEWORK_TITLE = {
  swot: "SWOT Analysis",
  porter: "Porter's Five Forces",
  bmc: "Business Model Canvas",
};
const PORTER_KEYS = [
  ["rivalry", "Competitive rivalry"],
  ["supplier_power", "Supplier power"],
  ["buyer_power", "Buyer power"],
  ["threat_of_entry", "Threat of new entry"],
  ["threat_of_substitution", "Threat of substitution"],
];
const BMC_FIELDS = [
  ["partners", "Key Partners"],
  ["activities", "Key Activities"],
  ["value", "Value Propositions"],
  ["relationships", "Customer Relationships"],
  ["segments", "Customer Segments"],
  ["channels", "Channels"],
  ["resources", "Key Resources"],
  ["costs", "Cost Structure"],
  ["revenue", "Revenue Streams"],
];
const MARKET_COLS = [
  ["competitors", "Competitors"],
  ["suppliers", "Suppliers & Partners"],
  ["customers", "Customers & Buyers"],
];
const BLOCK_TASKS = {
  idea: [
    ["idea.research", "Research"],
    ["idea.swot", "SWOT"],
    ["idea.porter", "Five Forces"],
    ["idea.bmc", "Canvas"],
  ],
  reference: [
    ["ref.verify", "Verify"],
    ["ref.summarize", "Summarize"],
  ],
  action: [
    ["action.draft", "Draft email"],
    ["action.steps", "Create steps"],
  ],
};
const SWOTS = [
  ["strengths", "Strengths", "border-l-emerald-500"],
  ["weaknesses", "Weaknesses", "border-l-rose-500"],
  ["opportunities", "Opportunities", "border-l-sky-500"],
  ["threats", "Threats", "border-l-amber-500"],
];
function hostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}
function parseJSON(text) {
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const json = fenced ? fenced[1] : text.match(/\{[\s\S]*\}/)?.[0] || text;
    return JSON.parse(json);
  } catch {
    return { raw: text };
  }
}
function SourceChips({ sources }) {
  if (!sources?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sources
        .filter((s) => s?.url)
        .map((s, i) => (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            title={s.title || s.url}
            className="inline-flex max-w-48 items-center gap-1.5 truncate rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] text-stone-600 hover:border-wood-500 hover:text-wood-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
          >
            <ExternalLink size={11} />
            {hostname(s.url) || s.title}
          </a>
        ))}
    </div>
  );
}
function Badge({ Icon, children }) {
  return (
    <span className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-wood-50 px-2 py-1 text-[11px] font-medium text-wood-700 dark:bg-wood-900/30 dark:text-wood-300">
      {Icon && <Icon size={13} />} {children}
    </span>
  );
}
function Rich({ text, citeMap }) {
  return String(text || "")
    .split(/(\[\d+\])/g)
    .map((part, i) => {
      const num = part.match(/^\[(\d+)\]$/)?.[1];
      return num && citeMap[num] ? (
        <a
          key={i}
          href={`#cite-${num}`}
          title={(citeMap[num].meta?.quote || "").slice(0, 300)}
          className="mx-0.5 rounded bg-wood-50 px-1 text-[11px] font-semibold text-wood-700 no-underline dark:bg-wood-900/30 dark:text-wood-300"
        >
          {part}
        </a>
      ) : (
        <span key={i}>{part}</span>
      );
    });
}
function EditableText({
  b,
  Tag = "p",
  className = "",
  editingId,
  setEditingId,
  patch,
  citeMap,
}) {
  return editingId === b.id ? (
    <textarea
      autoFocus
      defaultValue={b.text}
      rows={4}
      className={INPUT}
      onBlur={(e) => {
        patch(b.id, { text: e.target.value });
        setEditingId(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") e.currentTarget.blur();
      }}
    />
  ) : (
    <Tag
      title="Double-click to edit"
      onDoubleClick={() => setEditingId(b.id)}
      className={`${className} cursor-text whitespace-pre-wrap break-words`}
    >
      <Rich text={b.text} citeMap={citeMap} />
    </Tag>
  );
}
function Tools({ b, onAdd, onEdit, onDelete }) {
  const tools = [
    [FileText, "Paragraph", () => onAdd(b.id, "paragraph")],
    [Lightbulb, "Idea", () => onAdd(b.id, "idea")],
    [Link2, "Reference", () => onAdd(b.id, "reference")],
    [ListTodo, "Action", () => onAdd(b.id, "action")],
    [Pencil, "Edit", () => onEdit(b.id)],
    [Trash2, "Delete", () => onDelete(b.id)],
  ];
  return (
    <div className="absolute right-2 top-2 z-10 hidden items-center gap-1 rounded-lg border border-stone-200 bg-white p-1 shadow-sm group-hover:flex group-focus-within:flex dark:border-stone-700 dark:bg-stone-800 print:hidden">
      {tools.map(([Icon, name, fn]) => (
        <button
          key={name}
          type="button"
          aria-label={name}
          title={name}
          onClick={fn}
          className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-wood-600 dark:text-stone-400 dark:hover:bg-stone-700"
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
function DocumentBlock({
  b,
  editingId,
  setEditingId,
  patch,
  remove,
  addAfter,
  summon,
  running,
  streaming,
  citeMap,
}) {
  const d = b.meta?.data || {};
  const busy = running[b.id];
  const small = b.type === "paragraph" || b.type === "heading";
  const editProps = { editingId, setEditingId, patch, citeMap };
  return (
    <article
      id={b.meta?.citeIndex ? `cite-${b.meta.citeIndex}` : undefined}
      className={`group relative min-w-0 ${small ? "rounded-lg px-3 py-2 hover:bg-stone-100/70 dark:hover:bg-stone-800/40" : "my-3 rounded-xl border border-stone-200 bg-white p-5 text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"}`}
    >
      <Tools b={b} onAdd={addAfter} onEdit={setEditingId} onDelete={remove} />
      {(b.type === "streaming" || b.type === "streaming_task") && (
        <div className="rounded-lg border border-wood-500/30 bg-wood-50/40 p-4 dark:bg-wood-900/10">
          <Badge Icon={LoaderCircle}>
            {b.meta?.agent || b.meta?.kind || "Agent"}
          </Badge>
          <h3 className="my-2 text-sm font-semibold">{b.text}</h3>
          <pre className="max-h-72 min-h-10 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 font-mono text-xs leading-6 text-stone-700 dark:bg-stone-950 dark:text-stone-300">
            {b.type === "streaming"
              ? b.meta?.raw || ""
              : b.text === "Thinking..."
                ? ""
                : b.text}
            <LoaderCircle className="ml-2 inline animate-spin" size={13} />
          </pre>
        </div>
      )}
      {b.type === "heading" && (
        <>
          <EditableText
            b={b}
            Tag="h2"
            className="mt-2 text-xl font-semibold tracking-tight"
            {...editProps}
          />
          <SourceChips sources={b.meta?.sources} />
        </>
      )}
      {b.type === "paragraph" && (
        <EditableText
          b={b}
          className="text-sm leading-7 text-stone-700 dark:text-stone-300"
          {...editProps}
        />
      )}
      {b.type === "idea" && (
        <>
          <Badge Icon={Lightbulb}>Idea</Badge>
          <EditableText b={b} className="text-sm leading-7" {...editProps} />
        </>
      )}
      {b.type === "reference" && (
        <>
          <Badge Icon={b.meta?.citeIndex ? BookOpen : Link2}>
            {b.meta?.citeIndex ? `Reference ${b.meta.citeIndex}` : "Web source"}
          </Badge>
          <div className="mt-1 break-words text-sm font-medium">
            {b.meta?.url ? (
              <a
                href={b.meta.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-wood-600 hover:underline dark:text-wood-300"
              >
                {b.text}
                <ExternalLink size={13} />
              </a>
            ) : (
              b.text
            )}
          </div>
          {b.meta?.quote && (
            <p className={`mt-2 italic ${MUTED}`}>
              “{String(b.meta.quote).slice(0, 400)}
              {String(b.meta.quote).length > 400 ? "…" : ""}”
            </p>
          )}
        </>
      )}
      {b.type === "action" && (
        <>
          <label className="flex flex-wrap items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-wood-500"
              checked={!!b.meta?.done}
              onChange={(e) =>
                patch(b.id, { meta: { ...b.meta, done: e.target.checked } })
              }
            />
            <span
              className={`min-w-0 flex-1 ${b.meta?.done ? "line-through opacity-60" : ""}`}
            >
              <EditableText
                b={b}
                Tag="strong"
                className="font-semibold"
                {...editProps}
              />
            </span>
            {b.meta?.target && <span className={PILL}>{b.meta.target}</span>}
          </label>
          {b.meta?.detail && (
            <p className={`mt-2 pl-7 ${MUTED}`}>{b.meta.detail}</p>
          )}
        </>
      )}
      {b.type === "checklist" && (
        <details open className="[&>summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <ListChecks size={16} className="text-wood-500" />
            {b.text}
            <ChevronDown size={14} className="ml-auto" />
          </summary>
          <div className="mt-4 divide-y divide-stone-200 border-t border-stone-200 dark:divide-stone-800 dark:border-stone-800">
            {(b.meta?.steps || []).map((s, i) => (
              <div className="py-4" key={i}>
                <label className="flex items-start gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    defaultChecked={false}
                    className="mt-1 accent-wood-500"
                  />
                  {s.text}
                </label>
                <div className={`mt-2 space-y-1 pl-6 ${MUTED}`}>
                  {s.owner && (
                    <p className="flex items-center gap-2">
                      <UserRound size={13} />
                      Owner: {s.owner}
                    </p>
                  )}
                  {s.timing && (
                    <p className="flex items-center gap-2">
                      <Clock3 size={13} />
                      Timing: {s.timing}
                    </p>
                  )}
                  {s.cost && <p>Estimated cost: {s.cost}</p>}
                  {s.legal && (
                    <p className="flex items-center gap-2">
                      <Scale size={13} />
                      Legal: {s.legal}
                    </p>
                  )}
                  {s.links?.map((link, j) => (
                    <p key={j}>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={link}
                        className="inline-flex items-center gap-1 text-wood-600 dark:text-wood-300"
                      >
                        <Link2 size={13} />
                        {hostname(link)}
                      </a>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
      {b.type === "email_draft" && (
        <>
          <Badge Icon={Mail}>Email draft</Badge>
          <p className="mb-2 text-sm font-semibold">Subject: {b.text}</p>
          {b.meta?.target && (
            <span className={PILL}>
              <Target size={12} />
              To: {b.meta.target}
            </span>
          )}
          <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-950">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">
              {b.meta?.body || ""}
            </pre>
            <button
              type="button"
              className={`${BUTTON} mt-3`}
              onClick={() =>
                navigator.clipboard.writeText(
                  `Subject: ${b.text}\n\n${b.meta?.body || ""}`,
                )
              }
            >
              <Copy size={14} />
              Copy to clipboard
            </button>
          </div>
        </>
      )}
      {b.type === "forecast" && (
        <>
          <Badge Icon={ChartNoAxesCombined}>Forecast</Badge>
          <div className="w-full overflow-auto">
            <ForecastCharts forecast={b.meta?.forecast} />
          </div>
          <details className="mt-4 text-xs text-stone-500 dark:text-stone-400">
            <summary className="cursor-pointer">Show financial table</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-right text-xs">
                <thead>
                  <tr>
                    {["Month", "Units", "Revenue", "Gross", "Net"].map((x) => (
                      <th
                        key={x}
                        className="border-b border-stone-200 px-3 py-2 first:text-left dark:border-stone-700"
                      >
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(b.meta?.forecast?.rows || []).map((r) => (
                    <tr key={r.month}>
                      {[
                        "M" + r.month,
                        r.units,
                        r.revenue,
                        r.gross_profit,
                        r.net_profit,
                      ].map((x, i) => (
                        <td
                          key={i}
                          className="border-b border-stone-200 px-3 py-2 first:text-left dark:border-stone-700"
                        >
                          {x}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p className={`mt-3 ${MUTED}`}>
            Break-even: {b.meta?.forecast?.break_even_units ?? "—"} units/month
          </p>
          <SourceChips sources={b.meta?.sources} />
        </>
      )}
      {b.type === "swot" && (
        <>
          <Badge Icon={Compass}>SWOT analysis</Badge>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SWOTS.map(([key, label, color]) => (
              <section
                key={key}
                className={`rounded-lg border border-l-4 border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50 ${color}`}
              >
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide">
                  {label}
                </h4>
                <ul className="list-disc space-y-1 pl-4 text-xs leading-6 text-stone-600 dark:text-stone-300">
                  {(d[key] || []).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <SourceChips sources={b.meta?.sources} />
        </>
      )}
      {b.type === "porter" && (
        <>
          <Badge Icon={Swords}>Porter's Five Forces</Badge>
          <div className="mt-3 space-y-4">
            {PORTER_KEYS.map(([key, label]) => {
              const info = d[key] || {};
              const score = Math.min(Math.max(Number(info.score) || 3, 1), 5);
              return (
                <div key={key}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <strong>{label}</strong>
                    <span className="text-stone-500 dark:text-stone-400">
                      {score}/5
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className={`h-full rounded-full ${score >= 4 ? "bg-rose-500" : score >= 3 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${score * 20}%` }}
                    />
                  </div>
                  {info.note && <p className={`mt-1 ${MUTED}`}>{info.note}</p>}
                </div>
              );
            })}
          </div>
          <SourceChips sources={b.meta?.sources} />
        </>
      )}
      {b.type === "bmc" && (
        <>
          <Badge Icon={LayoutGrid}>Business Model Canvas</Badge>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BMC_FIELDS.map(([key, label]) => (
              <section
                key={key}
                className="min-w-0 rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800/50"
              >
                <h5 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  {label}
                </h5>
                <p className="break-words text-xs leading-6">{d[key] || "—"}</p>
              </section>
            ))}
          </div>
          <SourceChips sources={b.meta?.sources} />
        </>
      )}
      {b.type === "market" && (
        <>
          <Badge Icon={Globe2}>Market intelligence</Badge>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {MARKET_COLS.map(([key, label]) => (
              <section
                key={key}
                className="rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800/50"
              >
                <h5 className="mb-2 text-xs font-semibold">{label}</h5>
                <ul className="list-disc space-y-3 pl-4 text-xs leading-5">
                  {(d[key] || []).map((c, i) => (
                    <li key={i}>
                      {c.url ? (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-wood-600 hover:underline dark:text-wood-300"
                        >
                          {c.name}
                        </a>
                      ) : (
                        <strong>{c.name}</strong>
                      )}
                      {c.note && <p className={`mt-1 ${MUTED}`}>{c.note}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <SourceChips sources={b.meta?.sources} />
        </>
      )}
      {b.type === "agent_result" && (
        <>
          <Badge Icon={FileText}>Agent output</Badge>
          <p className="whitespace-pre-wrap break-words text-sm leading-7">
            <Rich text={b.text} citeMap={citeMap} />
          </p>
          {Array.isArray(b.meta?.steps) && (
            <ul className="mt-3 list-disc pl-5 text-xs">
              {b.meta.steps.map((x, i) => (
                <li key={i}>{typeof x === "string" ? x : x.text}</li>
              ))}
            </ul>
          )}
        </>
      )}
      {!!BLOCK_TASKS[b.type] && (
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          {BLOCK_TASKS[b.type].map(([kind, label]) => {
            const Icon = ACTION_ICONS[kind];
            return (
              <button
                type="button"
                className={BUTTON}
                key={kind}
                disabled={!!busy || streaming}
                title={label}
                onClick={() => summon(b, kind)}
              >
                {busy === kind ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <Icon size={14} />
                )}{" "}
                {busy === kind ? "Working..." : label}
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default function Editor({ doc }) {
  const [title, setTitle] = useState(doc.title);
  const [blocks, setBlocks] = useState(doc.blocks || []);
  const [running, setRunning] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("agents");
  const saveTimer = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/docs/" + doc._id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, blocks }),
      });
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [title, blocks, doc._id]);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("run");
    if (q && !started.current) {
      started.current = true;
      window.history.replaceState(null, "", window.location.pathname);
      consumeStream(q, true);
    }
  }, []);
  async function consumeStream(prompt, reset) {
    setConsoleOpen(true);
    setSidebarTab("agents");
    setLogs([]);
    setStreaming(true);
    if (reset) setBlocks([]);
    let liveId = null;
    try {
      const res = await fetch("/api/agents/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, docId: doc._id, lang: getSavedLang() }),
      });
      if (!res.ok || !res.body)
        throw new Error(`Stream request failed (${res.status})`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const event = (chunk.match(/^event: (.+)$/m) || [])[1],
            dataRaw = (chunk.match(/^data: (.+)$/m) || [])[1];
          if (!event || !dataRaw) continue;
          let data;
          try {
            data = JSON.parse(dataRaw);
          } catch {
            continue;
          }
          if (event === "stage")
            setLogs((l) => [
              ...l,
              { t: new Date().toISOString(), msg: data.msg },
            ]);
          if (event === "token")
            setBlocks((bs) => {
              if (!liveId) {
                liveId = uid();
                return [
                  { id: liveId, type: "paragraph", text: data.text },
                  ...bs,
                ];
              }
              return bs.map((b) =>
                b.id === liveId ? { ...b, text: b.text + data.text } : b,
              );
            });
          if (event === "stream_update")
            setBlocks((bs) =>
              bs.map((b) =>
                b.id === data.id
                  ? { ...b, meta: { ...b.meta, raw: data.text } }
                  : b,
              ),
            );
          if (event === "replace_block")
            setBlocks((bs) => {
              const i = bs.findIndex((b) => b.id === data.id);
              if (i === -1) return bs;
              const next = [...bs];
              next.splice(i, 1, ...(data.blocks || []));
              return next;
            });
          if (event === "block") setBlocks((bs) => [...bs, data.block]);
          if (event === "error")
            setLogs((l) => [
              ...l,
              { t: new Date().toISOString(), msg: "Error: " + data.message },
            ]);
        }
      }
    } catch (e) {
      setLogs((l) => [
        ...l,
        { t: new Date().toISOString(), msg: "Error: " + e.message },
      ]);
    } finally {
      setStreaming(false);
    }
  }
  async function summon(block, kind) {
    if (running[block.id]) return;
    setRunning((r) => ({ ...r, [block.id]: kind }));
    const streamId = uid();
    setBlocks((bs) => {
      if (
        bs.some(
          (b) => b.type === "streaming_task" && b.meta?.parentId === block.id,
        )
      )
        return bs;
      const i = bs.findIndex((b) => b.id === block.id);
      const next = [...bs];
      next.splice(i + 1, 0, {
        id: streamId,
        type: "streaming_task",
        text: "Thinking...",
        meta: { raw: "", kind, parentId: block.id },
      });
      return next;
    });
    try {
      const res = await fetch("/api/agents/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: TASKS[kind](block), context: title, lang: getSavedLang() }),
      });
      if (!res.ok || !res.body)
        throw new Error(`Task request failed (${res.status})`);
      const reader = res.body.getReader(),
        dec = new TextDecoder();
      let buf = "",
        fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const event = (chunk.match(/^event: (.+)$/m) || [])[1],
            dataRaw = (chunk.match(/^data: (.+)$/m) || [])[1];
          if (!event || !dataRaw) continue;
          let data;
          try {
            data = JSON.parse(dataRaw);
          } catch {
            continue;
          }
          if (event === "token") {
            fullText += data.text;
            setBlocks((bs) =>
              bs.map((b) => (b.id === streamId ? { ...b, text: fullText } : b)),
            );
          }
          if (event === "done") {
            const parsed = parseJSON(fullText);
            let next;
            if (kind === "action.steps")
              next = {
                id: uid(),
                type: "checklist",
                text: block.text,
                meta: { steps: parsed.steps || [], target: block.meta?.target },
              };
            else if (kind === "action.draft")
              next = {
                id: uid(),
                type: "email_draft",
                text: parsed.subject || "Draft",
                meta: {
                  body: parsed.body || fullText,
                  target: block.meta?.target,
                },
              };
            else if (FRAMEWORK_BLOCK[kind]) {
              const type = FRAMEWORK_BLOCK[kind];
              next = {
                id: uid(),
                type,
                text: FRAMEWORK_TITLE[type],
                meta: { data: parsed },
              };
            } else
              next = {
                id: uid(),
                type: "agent_result",
                text: fullText,
                meta: { data: parsed, for: block.text },
              };
            setBlocks((bs) => {
              const list = bs.filter((b) => b.id !== streamId);
              const i = list.findIndex((b) => b.id === block.id);
              list.splice(i + 1, 0, next);
              return list;
            });
          }
          if (event === "error")
            setBlocks((bs) =>
              bs.map((b) =>
                b.id === streamId
                  ? {
                      ...b,
                      type: "agent_result",
                      text: "Error: " + data.message,
                    }
                  : b,
              ),
            );
        }
      }
    } catch (e) {
      setBlocks((bs) =>
        bs.map((b) =>
          b.id === streamId
            ? { ...b, type: "agent_result", text: "Error: " + e.message }
            : b,
        ),
      );
    } finally {
      setRunning((r) => {
        const next = { ...r };
        delete next[block.id];
        return next;
      });
    }
  }
  const patch = (id, p) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...p } : b)));
  const remove = (id) => setBlocks((bs) => bs.filter((b) => b.id !== id));
  const addAfter = (id, type) =>
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === id);
      const next = [...bs];
      next.splice(i + 1, 0, { id: uid(), type, text: "", meta: {} });
      return next;
    });
  const citeMap = {};
  blocks.forEach((b) => {
    if (b.type === "reference" && b.meta?.citeIndex)
      citeMap[b.meta.citeIndex] = b;
  });
  return (
    <main className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1800px] grid-cols-1 bg-stone-50 text-stone-900 dark:bg-[#171716] dark:text-stone-100 lg:grid-cols-[300px_minmax(0,1fr)] print:block print:bg-white print:text-black">
      <aside className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] lg:overflow-y-auto lg:border-b-0 lg:border-r print:hidden">
        <AgentSidebar
          blocks={blocks}
          streaming={streaming}
          logs={logs}
          consoleOpen={consoleOpen}
          setConsoleOpen={setConsoleOpen}
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
        />
      </aside>
      <section className="min-w-0 px-4 py-0 sm:px-8 lg:px-12 print:p-0">
        <div className="sticky top-16 z-40 -mx-4 mb-6 flex min-h-16 items-center justify-between gap-3 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-stone-800 dark:bg-[#21201E]/95 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 print:hidden">
          <a
            href="/app"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-wood-500 dark:text-stone-400"
          >
            <ArrowLeft size={15} />
            All documents
          </a>
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap py-1">
            {streaming && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-wood-50 px-2.5 py-2 text-xs text-wood-700 dark:bg-wood-900/30 dark:text-wood-300">
                <Radio size={13} className="animate-pulse" />
                Live
              </span>
            )}
            <button
              className={BUTTON}
              title="Export Markdown"
              onClick={() =>
                download(
                  title.replace(/[^\w-]+/g, "_").slice(0, 60) + ".md",
                  "text/markdown",
                  blocksToMarkdown(blocks),
                )
              }
            >
              <Download size={14} />
              MD
            </button>
            <button
              className={BUTTON}
              title="Export Word"
              onClick={() => exportWord(title, blocks)}
            >
              <Download size={14} />
              Word
            </button>
            <button
              className={BUTTON}
              title="Print or save as PDF"
              onClick={() => window.print()}
            >
              <Printer size={14} />
              PDF
            </button>
            <button
              className={BUTTON}
              title="Open activity"
              onClick={() => {
                setConsoleOpen(true);
                setSidebarTab("activity");
              }}
            >
              <Terminal size={14} />
              Activity
            </button>
            <button
              className={PRIMARY}
              disabled={streaming}
              onClick={() =>
                consumeStream(
                  title + " — refresh and deepen this business plan",
                  true,
                )
              }
            >
              <Play size={14} />
              Run full plan
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-5xl">
          <input
            aria-label="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-6 w-full border-0 bg-transparent px-1 py-2 text-2xl font-bold tracking-tight text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 sm:text-3xl print:text-black"
          />
          <div className="space-y-3">
            {blocks.map((b) => (
              <div
                key={b.id}
                id={`wp-block-${b.id}`}
                className="min-w-0 scroll-mt-40"
              >
                <DocumentBlock
                  b={b}
                  editingId={editingId}
                  setEditingId={setEditingId}
                  patch={patch}
                  remove={remove}
                  addAfter={addAfter}
                  summon={summon}
                  running={running}
                  streaming={streaming}
                  citeMap={citeMap}
                />
              </div>
            ))}
          </div>
          {blocks.length === 0 && !streaming && (
            <div className={`${PANEL} border-dashed py-12 text-center`}>
              <FileText className="mx-auto mb-3 text-stone-400" size={28} />
              <p className="text-sm font-medium">This document is empty</p>
              <p className={`mt-2 ${MUTED}`}>
                Run the full plan or add a block below.
              </p>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2 print:hidden">
            <button
              className={BUTTON}
              onClick={() =>
                setBlocks((bs) => [
                  ...bs,
                  { id: uid(), type: "paragraph", text: "", meta: {} },
                ])
              }
            >
              <Plus size={14} />
              Paragraph
            </button>
            <button
              className={BUTTON}
              onClick={() =>
                setBlocks((bs) => [
                  ...bs,
                  { id: uid(), type: "idea", text: "", meta: {} },
                ])
              }
            >
              <Lightbulb size={14} />
              Idea
            </button>
            <button
              className={BUTTON}
              onClick={() =>
                setBlocks((bs) => [
                  ...bs,
                  { id: uid(), type: "action", text: "", meta: {} },
                ])
              }
            >
              <ListTodo size={14} />
              Action point
            </button>
          </div>
          <p className={`mt-7 print:hidden ${MUTED}`}>
            Autosaves as you edit. Double-click any text to edit; hover a block
            for controls.
          </p>
        </div>
      </section>
    </main>
  );
}
