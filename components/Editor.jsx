"use client";
import { useEffect, useRef, useState } from "react";
import { uid } from "@/lib/blocks";
import { blocksToMarkdown, download, exportWord } from "@/lib/export";
import { ForecastCharts } from "@/components/Charts";

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

const FRAMEWORK_BLOCK = { "idea.swot": "swot", "idea.porter": "porter", "idea.bmc": "bmc" };
const FRAMEWORK_TITLE = { swot: "SWOT Analysis", porter: "Porter's Five Forces", bmc: "Business Model Canvas" };
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

function hostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

// NEW: Compact Source Chips Component
function SourceChips({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div
      className="row"
      style={{ marginTop: 8, gap: 6, flexWrap: "wrap" }}
    >
      {sources.map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noreferrer"
          title={s.title || s.url}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            padding: "2px 6px",
            borderRadius: 999,
            background: "var(--panel-2)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
            textDecoration: "none",
            maxWidth: 140,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--muted)";
          }}
        >
          <img
            src={`https://www.google.com/s2/favicons?domain=${hostname(s.url)}&sz=16`}
            width={10}
            height={10}
            alt=""
            style={{ borderRadius: 2 }}
          />
          {hostname(s.url)}
        </a>
      ))}
    </div>
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
  }, [title, blocks]);

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
    setLogs([]);
    setStreaming(true);
    if (reset) setBlocks([]);
    let liveId = null;
    try {
      const res = await fetch("/api/agents/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, docId: doc._id }),
      });
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
          const event = (chunk.match(/^event: (.+)$/m) || [])[1];
          const dataRaw = (chunk.match(/^data: (.+)$/m) || [])[1];
          if (!event || !dataRaw) continue;
          const data = JSON.parse(dataRaw);

          if (event === "stage") setLogs((l) => [...l, { t: new Date().toISOString(), msg: data.msg }]);
          if (event === "token") {
            setBlocks((bs) => {
              if (!liveId) {
                liveId = uid();
                return [{ id: liveId, type: "paragraph", text: data.text }, ...bs];
              }
              return bs.map((b) => (b.id === liveId ? { ...b, text: b.text + data.text } : b));
            });
          }
          if (event === "stream_update") {
            setBlocks((bs) => bs.map((b) => (b.id === data.id ? { ...b, meta: { ...b.meta, raw: data.text } } : b)));
          }
          if (event === "replace_block") {
            setBlocks((bs) => {
              const idx = bs.findIndex((b) => b.id === data.id);
              if (idx === -1) return bs;
              const newBs = [...bs];
              newBs.splice(idx, 1, ...data.blocks);
              return newBs;
            });
          }
          if (event === "block") setBlocks((bs) => [...bs, data.block]);
          if (event === "error") setLogs((l) => [...l, { t: new Date().toISOString(), msg: "⛔ " + data.message }]);
        }
      }
    } catch (e) {
      setLogs((l) => [...l, { t: new Date().toISOString(), msg: "⛔ " + e.message }]);
    } finally {
      setStreaming(false);
    }
  }

  async function summon(block, kind) {
    if (running[block.id]) return;
    setRunning((r) => ({ ...r, [block.id]: kind }));
    const streamId = uid();
    setBlocks((bs) => {
      const exists = bs.find((b) => b.type === "streaming_task" && b.meta?.parentId === block.id);
      if (exists) return bs;
      const i = bs.findIndex((b) => b.id === block.id);
      bs.splice(i + 1, 0, {
        id: streamId,
        type: "streaming_task",
        text: "Thinking...",
        meta: { raw: "", kind, parentId: block.id },
      });
      return [...bs];
    });

    try {
      const res = await fetch("/api/agents/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: TASKS[kind](block), context: title }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const event = (chunk.match(/^event: (.+)$/m) || [])[1];
          const dataRaw = (chunk.match(/^data: (.+)$/m) || [])[1];
          if (!event || !dataRaw) continue;
          const data = JSON.parse(dataRaw);

          if (event === "token") {
            fullText += data.text;
            setBlocks((bs) => bs.map((b) => (b.id === streamId ? { ...b, text: fullText } : b)));
          }

          if (event === "done") {
            let parsed = {};
            try {
              const match = fullText.match(/```json\s*([\s\S]*?)```/) || fullText.match(/\{[\s\S]*\}/);
              const jsonStr = match ? match[0] : fullText;
              parsed = JSON.parse(jsonStr);
            } catch (e) {
              parsed = { raw: fullText };
            }

            let newBlock;
            if (kind === "action.steps") {
              newBlock = {
                id: uid(),
                type: "checklist",
                text: block.text,
                meta: { steps: parsed.steps || [], target: block.meta?.target },
              };
            } else if (kind === "action.draft") {
              newBlock = {
                id: uid(),
                type: "email_draft",
                text: parsed.subject || "Draft",
                meta: { body: parsed.body || fullText, target: block.meta?.target },
              };
            } else if (FRAMEWORK_BLOCK[kind]) {
              const t = FRAMEWORK_BLOCK[kind];
              newBlock = { id: uid(), type: t, text: FRAMEWORK_TITLE[t], meta: { data: parsed } };
            } else {
              newBlock = { id: uid(), type: "agent_result", text: fullText, meta: { data: parsed, for: block.text } };
            }

            setBlocks((bs) => {
              const filtered = bs.filter((b) => b.id !== streamId);
              const i = filtered.findIndex((b) => b.id === block.id);
              filtered.splice(i + 1, 0, newBlock);
              return filtered;
            });
          }
          if (event === "error") {
            setBlocks((bs) =>
              bs.map((b) => (b.id === streamId ? { ...b, type: "agent_result", text: "⛔ Error: " + data.message } : b)),
            );
          }
        }
      }
    } catch (e) {
      setBlocks((bs) => bs.map((b) => (b.id === streamId ? { ...b, type: "agent_result", text: " Error: " + e.message } : b)));
    } finally {
      setRunning((r) => {
        const c = { ...r };
        delete c[block.id];
        return c;
      });
    }
  }

  const patch = (id, p) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...p } : b)));
  const remove = (id) => setBlocks((bs) => bs.filter((b) => b.id !== id));
  const addAfter = (id, type) =>
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === id);
      bs.splice(i + 1, 0, { id: uid(), type, text: "", meta: {} });
      return [...bs];
    });

  const citeMap = {};
  blocks.forEach((b) => {
    if (b.type === "reference" && b.meta?.citeIndex) citeMap[b.meta.citeIndex] = b;
  });

  function Rich({ text }) {
    const parts = String(text || "").split(/(\[\d+\])/g);
    return parts.map((p, i) => {
      const m = p.match(/^\[(\d+)\]$/);
      if (m && citeMap[m[1]]) {
        return (
          <a
            key={i}
            className="cite"
            href={"#cite-" + m[1]}
            title={(citeMap[m[1]].meta?.quote || "").slice(0, 300)}
          >
            [{m[1]}]
          </a>
        );
      }
      return <span key={i}>{p}</span>;
    });
  }

  function EditableText({ b, Tag, className }) {
    if (editingId === b.id)
      return (
        <textarea
          className="input"
          rows={4}
          autoFocus
          defaultValue={b.text}
          onBlur={(e) => {
            patch(b.id, { text: e.target.value });
            setEditingId(null);
          }}
        />
      );
    return (
      <Tag
        className={className + " editable"}
        title="Double-click to edit"
        onDoubleClick={() => setEditingId(b.id)}
      >
        <Rich text={b.text} />
      </Tag>
    );
  }

  function Tools({ b }) {
    return (
      <span className="tools noprint">
        <button
          title="Add paragraph below"
          onClick={() => addAfter(b.id, "paragraph")}
        >
          +¶
        </button>
        <button
          title="Add idea block below"
          onClick={() => addAfter(b.id, "idea")}
        >
          +💡
        </button>
        <button
          title="Add reference block below"
          onClick={() => addAfter(b.id, "reference")}
        >
          +🔗
        </button>
        <button
          title="Add action point below"
          onClick={() => addAfter(b.id, "action")}
        >
          +☐
        </button>
        <button
          title="Edit this block"
          onClick={() => setEditingId(b.id)}
        >
          ✎
        </button>
        <button
          title="Delete this block"
          onClick={() => remove(b.id)}
        >
          🗑
        </button>
      </span>
    );
  }

  function Block({ b }) {
    const busy = running[b.id];
    const d = b.meta?.data || {};
    const agents =
      {
        idea: [
          ["idea.research", "🔍 Research", "Summon a research agent on this idea"],
          ["idea.swot", "🧭 SWOT", "Generate a SWOT analysis block"],
          ["idea.porter", "⚔️ 5 Forces", "Score Porter's Five Forces"],
          ["idea.bmc", "🗺 Canvas", "Fill a Business Model Canvas"],
        ],
        reference: [
          ["ref.verify", "✓ Verify", "Fact-check this source"],
          ["ref.summarize", "✎ Summarize", "Extract actionable points"],
        ],
        action: [
          ["action.draft", "✉ Draft outreach", `Draft an outreach email to ${b.meta?.target || "the target"}`],
          ["action.steps", "☑ Break into steps", "Convert into a checklist"],
        ],
      }[b.type] || [];

    const anchorId = b.meta?.citeIndex ? `cite-${b.meta.citeIndex}` : undefined;

    return (
      <div
        id={anchorId}
        className={b.type === "paragraph" || b.type === "heading" ? "block" : "card"}
      >
        <Tools b={b} />

        {(b.type === "streaming" || b.type === "streaming_task") && (
          <div className="streaming-task">
            <span className="badge">⚡ {b.meta?.agent || b.meta?.kind || "agent"}</span>
            <h4 style={{ margin: "4px 0 8px", fontSize: 14, color: "var(--accent-text)" }}>{b.text}</h4>
            <pre className="streaming-raw">
              {b.type === "streaming" ? b.meta?.raw || "" : b.text === "Thinking..." ? "" : b.text}
              <span
                className="spin"
                style={{ marginLeft: 4 }}
              />
            </pre>
          </div>
        )}

        {b.type === "checklist" && (
          <details
            className="checklist-details"
            open
          >
            <summary className="checklist-summary">
              <span className="badge">☑ Checklist</span>
              <span style={{ fontWeight: 600, marginLeft: 8 }}>{b.text}</span>
              {b.meta?.target && (
                <span
                  className="chip"
                  style={{ marginLeft: 8 }}
                >
                  {" "}
                  {b.meta.target}
                </span>
              )}
            </summary>
            <div className="checklist-content-wrapper">
              {(b.meta?.steps || []).map((step, i) => (
                <div
                  key={i}
                  className="checklist-item-detailed"
                >
                  <div className="checklist-header">
                    <input
                      type="checkbox"
                      defaultChecked={false}
                    />
                    <span className="checklist-text">{step.text}</span>
                  </div>
                  <div className="checklist-meta">
                    {step.owner && (
                      <div className="meta-item">
                        👤 <b>Owner:</b> {step.owner}
                      </div>
                    )}
                    {step.timing && (
                      <div className="meta-item">
                        ⏱ <b>Timing:</b> {step.timing}
                      </div>
                    )}
                    {step.cost && (
                      <div className="meta-item">
                        {" "}
                        <b>Est. Cost:</b> {step.cost}
                      </div>
                    )}
                    {step.legal && (
                      <div className="meta-item legal-note">
                        ️ <b>Legal:</b> {step.legal}
                      </div>
                    )}
                    {step.links && step.links.length > 0 && (
                      <div className="meta-item">
                        🔗 <b>Links:</b>{" "}
                        {step.links.map((l, li) => (
                          <a
                            key={li}
                            href={l}
                            target="_blank"
                            rel="noreferrer"
                            style={{ marginLeft: 4 }}
                          >
                            {hostname(l)}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  {step.timing && (
                    <div className="gantt-bar-container">
                      <div
                        className="gantt-bar"
                        style={{ width: `${Math.min(100, (step.text.length % 50) + 20)}%` }}
                        title={step.timing}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        {b.type === "email_draft" && (
          <>
            <span className="badge">✉ Email Draft</span>
            <p
              className="blk"
              style={{ fontWeight: 600, marginBottom: 4 }}
            >
              Subject: {b.text}
            </p>
            {b.meta?.target && (
              <div
                className="chip"
                style={{ marginBottom: 8 }}
              >
                🎯 To: {b.meta.target}
              </div>
            )}
            <div className="email-body">
              <pre>{b.meta?.body || ""}</pre>
              <button
                className="btn ghost mini"
                style={{ marginTop: 8 }}
                onClick={() => navigator.clipboard.writeText(`Subject: ${b.text}\n\n${b.meta?.body || ""}`)}
              >
                📋 Copy to clipboard
              </button>
            </div>
          </>
        )}

        {b.type === "heading" && (
          <>
            <EditableText
              b={b}
              Tag="h2"
              className="blk"
            />
            <SourceChips sources={b.meta?.sources} />
          </>
        )}

        {b.type === "paragraph" && (
          <EditableText
            b={b}
            Tag="p"
            className="blk"
          />
        )}

        {b.type === "idea" && (
          <>
            <span className="badge">💡 idea</span>
            <EditableText
              b={b}
              Tag="p"
              className="blk"
            />
          </>
        )}

        {b.type === "reference" && (
          <>
            <span className="badge">{b.meta?.citeIndex ? `[${b.meta.citeIndex}] 📄` : "🔗 web"}</span>
            {b.meta?.url ? (
              <span
                className="row"
                style={{ gap: 8, display: "inline-flex" }}
              >
                <img
                  className="favicon"
                  src={`https://www.google.com/s2/favicons?domain=${hostname(b.meta.url)}&sz=32`}
                  width={16}
                  height={16}
                  alt=""
                  title={hostname(b.meta.url)}
                />
                <a
                  href={b.meta.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`Open ${hostname(b.meta.url)} in a new tab`}
                >
                  <strong>{b.text}</strong> ↗
                </a>
              </span>
            ) : (
              <strong>{b.text}</strong>
            )}
            {b.meta?.quote && (
              <p
                className="muted"
                style={{ fontStyle: "italic" }}
              >
                “{b.meta.quote.slice(0, 400)}
                {b.meta.quote.length > 400 ? "…" : ""}”
              </p>
            )}
          </>
        )}

        {b.type === "action" && (
          <>
            <label
              className="row"
              style={{ gap: 10 }}
              title="Tick when done; double-click text to edit"
            >
              <input
                type="checkbox"
                checked={!!b.meta?.done}
                onChange={(e) => patch(b.id, { meta: { ...b.meta, done: e.target.checked } })}
              />
              <span
                style={{ textDecoration: b.meta?.done ? "line-through" : "none" }}
                className="editable"
                onDoubleClick={() => setEditingId(b.id)}
              >
                {editingId === b.id ? (
                  <textarea
                    className="input"
                    rows={2}
                    autoFocus
                    defaultValue={b.text}
                    onBlur={(e) => {
                      patch(b.id, { text: e.target.value });
                      setEditingId(null);
                    }}
                  />
                ) : (
                  <strong>{b.text}</strong>
                )}
              </span>
              {b.meta?.target && (
                <span
                  className="chip"
                  title="Target organization / authority to contact"
                >
                  {" "}
                  {b.meta.target}
                </span>
              )}
            </label>
            {b.meta?.detail && (
              <div
                className="muted"
                style={{ marginLeft: 26 }}
              >
                {b.meta.detail}
              </div>
            )}
          </>
        )}

        {b.type === "forecast" && (
          <>
            <span className="badge">💰 forecast</span>
            <ForecastCharts forecast={b.meta?.forecast} />
            <details className="muted">
              <summary
                style={{ cursor: "pointer" }}
                title="Show the raw numbers"
              >
                Show table
              </summary>
              <table className="fc">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Units</th>
                    <th>Revenue</th>
                    <th>Gross</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {(b.meta?.forecast?.rows || []).map((r) => (
                    <tr key={r.month}>
                      <td>M{r.month}</td>
                      <td>{r.units}</td>
                      <td>{r.revenue}</td>
                      <td>{r.gross_profit}</td>
                      <td>{r.net_profit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
            <div className="muted">Break-even: {b.meta?.forecast?.break_even_units ?? "—"} units/month</div>
            <SourceChips sources={b.meta?.sources} />
          </>
        )}

        {b.type === "swot" && (
          <>
            <span className="badge">🧭 SWOT</span>
            <div className="swot">
              {[
                ["strengths", "Strengths", "s"],
                ["weaknesses", "Weaknesses", "w"],
                ["opportunities", "Opportunities", "o"],
                ["threats", "Threats", "t"],
              ].map(([k, label, cls]) => (
                <div
                  key={k}
                  className={"q " + cls}
                >
                  <h4>{label}</h4>
                  <ul>
                    {(d[k] || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        {b.type === "porter" && (
          <>
            <span className="badge">️ Porter&apos;s Five Forces</span>
            <div className="porter">
              {PORTER_KEYS.map(([k, label]) => {
                const item = d[k] || {};
                const score = Math.min(Math.max(Number(item.score) || 3, 1), 5);
                return (
                  <div
                    key={k}
                    className="prow"
                    title={`${label}: ${score}/5`}
                  >
                    <span className="plabel">{label}</span>
                    <span className="meter">
                      <span
                        className={score >= 4 ? "high" : score >= 3 ? "med" : "low"}
                        style={{ width: (score / 5) * 100 + "%" }}
                      />
                    </span>
                    <span className="pscore">{score}/5</span>
                    {item.note && <div className="muted pnote">{item.note}</div>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {b.type === "bmc" && (
          <>
            <span className="badge">🗺 Business Model Canvas</span>
            <div className="bmc">
              {BMC_FIELDS.map(([k, label]) => (
                <div
                  key={k}
                  className="bcell"
                  title={label}
                >
                  <h5>{label}</h5>
                  <p>{d[k] || "—"}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {b.type === "market" && (
          <>
            <span className="badge">🌐 market intel</span>
            <div className="market">
              {MARKET_COLS.map(([k, label]) => (
                <div
                  key={k}
                  className="mcell"
                >
                  <h5>{label}</h5>
                  <ul>
                    {(d[k] || []).map((c, i) => (
                      <li key={i}>
                        {c.url ? (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            title={`Open ${c.name || hostname(c.url)} website`}
                          >
                            <img
                              className="favicon"
                              src={`https://www.google.com/s2/favicons?domain=${hostname(c.url)}&sz=32`}
                              width={14}
                              height={14}
                              alt=""
                            />{" "}
                            {c.name}
                          </a>
                        ) : (
                          <strong>{c.name}</strong>
                        )}
                        {c.note && <span className="muted"> — {c.note}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <SourceChips sources={b.meta?.sources} />
          </>
        )}

        {b.type === "agent_result" && (
          <>
            <span className="badge">🤖 agent output</span>
            <p className="blk">
              <Rich text={b.text} />
            </p>
            {(b.meta?.steps || []).length > 0 && (
              <ul>
                {b.meta.steps.map((s, i) => (
                  <li
                    key={i}
                    className="muted"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {agents.length > 0 && (
          <div
            className="row noprint"
            style={{ marginTop: 8 }}
          >
            {agents.map(([kind, label, tip]) => (
              <button
                key={kind}
                className="btn ghost mini"
                title={tip}
                disabled={!!busy || streaming}
                onClick={() => summon(b, kind)}
              >
                {busy === kind ? (
                  <>
                    <span className="spin" /> thinking…
                  </>
                ) : (
                  label
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="wrap">
      <div
        className="row noprint"
        style={{ justifyContent: "space-between", marginBottom: 8 }}
      >
        <a
          href="/app"
          className="muted"
          title="Back to dashboard"
        >
          ← All documents
        </a>
        <div className="row">
          {streaming && (
            <span
              className="pill"
              title="Agents are writing this document right now"
            >
              <span className="spin" /> live
            </span>
          )}
          <button
            className="btn ghost mini"
            title="Download as Markdown (.md)"
            onClick={() =>
              download(title.replace(/[^\w-]+/g, "_").slice(0, 60) + ".md", "text/markdown", blocksToMarkdown(blocks))
            }
          >
            ⬇ MD
          </button>
          <button
            className="btn ghost mini"
            title="Download as Word document (.doc)"
            onClick={() => exportWord(title, blocks)}
          >
            ⬇ Word
          </button>
          <button
            className="btn ghost mini"
            title="Print or save as PDF"
            onClick={() => window.print()}
          >
            🖨 PDF
          </button>
          <button
            className="btn ghost mini"
            title="Show or hide the live agent log"
            onClick={() => setConsoleOpen((v) => !v)}
          >
            Agent console
          </button>
          <button
            className="btn mini"
            disabled={streaming}
            title="Re-run all agents and rebuild this document live"
            onClick={() => consumeStream(title + " — refresh and deepen this business plan", true)}
          >
            ▶ Run full plan
          </button>
        </div>
      </div>
      <input
        style={{
          background: "transparent",
          border: 0,
          color: "var(--text)",
          width: "100%",
          outline: "none",
          fontSize: 30,
          fontWeight: 700,
        }}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        title="Document title"
      />
      {consoleOpen && (
        <div
          className="console noprint"
          style={{ margin: "12px 0" }}
        >
          {logs.map((l, i) => (
            <div key={i}>
              {l.t.slice(11, 19)} {l.msg}
            </div>
          ))}
          {logs.length === 0 && <div className="muted">No job running.</div>}
        </div>
      )}
      {blocks.map((b) => (
        <Block
          key={b.id}
          b={b}
        />
      ))}
      {blocks.length === 0 && !streaming && <p className="muted">Empty document. Use “▶ Run full plan” or add blocks below.</p>}
      <div
        className="row noprint"
        style={{ marginTop: 16 }}
      >
        <button
          className="btn ghost mini"
          title="Append a paragraph block"
          onClick={() => setBlocks((bs) => [...bs, { id: uid(), type: "paragraph", text: "" }])}
        >
          + paragraph
        </button>
        <button
          className="btn ghost mini"
          title="Append an idea block"
          onClick={() => setBlocks((bs) => [...bs, { id: uid(), type: "idea", text: "", meta: {} }])}
        >
          + idea
        </button>
        <button
          className="btn ghost mini"
          title="Append an action point"
          onClick={() => setBlocks((bs) => [...bs, { id: uid(), type: "action", text: "", meta: {} }])}
        >
          + action point
        </button>
      </div>
      <div
        className="muted noprint"
        style={{ marginTop: 24 }}
      >
        Autosaves as you type. Double-click any text to edit; hover blocks for tools; hover buttons for explanations.
      </div>
    </main>
  );
}
