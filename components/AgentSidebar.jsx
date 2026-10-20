"use client";
import {
  Search,
  Scale,
  Compass,
  Globe2,
  ChartNoAxesCombined,
  Presentation,
  BookOpen,
  Check,
  Circle,
  LoaderCircle,
  Activity,
  Terminal,
  Radio,
} from "lucide-react";
const AGENTS = [
  {
    id: "research",
    name: "Research",
    Icon: Search,
    match: (b, all) => b.type === "paragraph" && all.indexOf(b) === 0,
  },
  {
    id: "legal",
    name: "Legal & Compliance",
    Icon: Scale,
    match: (b) =>
      b.type === "action" ||
      (b.type === "heading" &&
        /legal|compliance|grant|incentive/i.test(b.text)),
  },
  {
    id: "strategy",
    name: "Strategy",
    Icon: Compass,
    match: (b) => ["swot", "porter", "bmc"].includes(b.type),
  },
  {
    id: "market",
    name: "Market Intelligence",
    Icon: Globe2,
    match: (b) => b.type === "market",
  },
  {
    id: "finance",
    name: "Financial Analysis",
    Icon: ChartNoAxesCombined,
    match: (b) => b.type === "forecast",
  },
  {
    id: "pitch",
    name: "Elevator Pitch",
    Icon: Presentation,
    match: (b) => b.type === "heading" && /elevator pitch/i.test(b.text),
  },
  {
    id: "refs",
    name: "References",
    Icon: BookOpen,
    match: (b) => b.type === "reference",
  },
];
export default function AgentSidebar({
  blocks = [],
  streaming,
  logs = [],
  consoleOpen,
  setConsoleOpen,
  activeTab = "agents",
  onTabChange = () => {},
}) {
  const agents = AGENTS.map((agent) => {
    const live = blocks.find(
      (b) => b.type === "streaming" && b.meta?.agent === agent.id,
    );
    const result = blocks.find((b) => agent.match(b, blocks));
    return {
      ...agent,
      status: live ? "running" : result ? "complete" : "waiting",
      targetId: live?.id || result?.id,
      preview: live?.meta?.raw || "",
    };
  });
  const completed = agents.filter((a) => a.status === "complete").length,
    active = agents.filter((a) => a.status === "running").length;
  const jump = (id) =>
    document
      .getElementById(`wp-block-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <div className="flex min-h-full flex-col gap-5 p-4 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-stone-500 dark:text-stone-400">
            Workspace
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight">
            Agent activity
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${streaming ? "border-wood-500/30 bg-wood-50 text-wood-700 dark:bg-wood-900/30 dark:text-wood-300" : "border-stone-200 text-stone-500 dark:border-stone-700 dark:text-stone-400"}`}
        >
          {streaming ? (
            <Radio size={12} className="animate-pulse" />
          ) : (
            <Circle size={12} />
          )}{" "}
          {streaming ? "Live" : "Idle"}
        </span>
      </div>
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/60">
        <div className="mb-3 flex justify-between text-xs">
          <strong>Generation progress</strong>
          <span className="font-medium tabular-nums text-wood-600 dark:text-wood-300">
            {completed}/{AGENTS.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={AGENTS.length}
          aria-valuenow={completed}
          className="h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"
        >
          <div
            className="h-full rounded-full bg-wood-500 transition-all duration-300"
            style={{ width: `${(100 * completed) / AGENTS.length}%` }}
          />
        </div>
        <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400">
          {streaming
            ? `${active} active agents`
            : "No agents currently running"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
        {[
          ["agents", Activity, "Agents"],
          ["activity", Terminal, "Activity"],
        ].map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              onTabChange(id);
              if (id === "activity") setConsoleOpen(true);
            }}
            className={`flex items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-medium ${activeTab === id ? "bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-white" : "text-stone-500 dark:text-stone-400"}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
      {activeTab === "agents" ? (
        <div className="space-y-2">
          {agents.map((a) => (
            <div
              key={a.id}
              className={`overflow-hidden rounded-xl border bg-white dark:bg-stone-900 ${a.status === "running" ? "border-wood-500/50" : "border-stone-200 dark:border-stone-800"}`}
            >
              <button
                disabled={!a.targetId}
                type="button"
                onClick={() => jump(a.targetId)}
                className="flex w-full items-center gap-3 p-3 text-left disabled:cursor-default"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                  <a.Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs">{a.name}</strong>
                  <span className="mt-1 block text-[11px] text-stone-500 dark:text-stone-400">
                    {a.status === "running"
                      ? "Generating"
                      : a.status === "complete"
                        ? "Output available"
                        : "Waiting"}
                  </span>
                </span>
                {a.status === "running" ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin text-wood-500"
                  />
                ) : a.status === "complete" ? (
                  <Check size={16} className="text-emerald-600" />
                ) : (
                  <Circle size={14} className="text-stone-400" />
                )}
              </button>
              {a.status === "running" && (
                <div className="border-t border-stone-200 bg-stone-50 px-3 py-3 dark:border-stone-800 dark:bg-stone-800/50">
                  <p className="mb-2 text-[10px] font-medium text-wood-600 dark:text-wood-300">
                    Live output
                  </p>
                  <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-stone-600 dark:text-stone-300">
                    {a.preview
                      ? a.preview.slice(-500)
                      : "Preparing response..."}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between border-b border-stone-200 px-3 py-3 dark:border-stone-800">
            <strong className="text-xs">Execution log</strong>
            <button
              type="button"
              className="text-xs text-wood-600 dark:text-wood-300"
              onClick={() => setConsoleOpen(!consoleOpen)}
            >
              {consoleOpen ? "Hide" : "Show"}
            </button>
          </div>
          {consoleOpen && (
            <div className="max-h-[450px] space-y-2 overflow-auto p-3">
              {logs.length === 0 ? (
                <p className="text-xs text-stone-500">No activity yet.</p>
              ) : (
                logs.map((l, i) => (
                  <div
                    key={i}
                    className="flex gap-3 border-b border-stone-100 py-2 text-[11px] last:border-0 dark:border-stone-800"
                  >
                    <time className="font-mono text-stone-500">
                      {l.t.slice(11, 19)}
                    </time>
                    <span className="break-words">{l.msg}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
      <p className="mt-auto border-t border-stone-200 pt-4 text-[11px] text-stone-500 dark:border-stone-800 dark:text-stone-400">
        Document updates automatically while agents run.
      </p>
    </div>
  );
}
