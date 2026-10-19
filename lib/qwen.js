import { db } from "@/lib/mongo";

const BASE = () => process.env.QWEN_BASE || "https://maas.qwencloudapi.com/compatible-mode/v1";
const KEY = () => process.env.QWEN_API_KEY;
const MODEL = () => process.env.QWEN_MODEL || "qwen3.7-flash";

export async function embed(text) {
  const r = await fetch(`${process.env.OLLAMA_URL || "http://localhost:11434"}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text", input: text }),
  });
  const j = await r.json();
  return (j.embeddings || [])[0] || null;
}

export async function vectorSearch(vector, limit = 3) {
  if (!vector) return [];
  return db()
    .collection("document_chunks")
    .aggregate([
      { $vectorSearch: { index: "vector_index", path: "embedding", queryVector: vector, numCandidates: 20, limit } },
      { $project: { title: 1, page: 1, chunk_text: 1, category: 1 } },
    ])
    .toArray();
}

export async function qwenJSON({ system, user, search = false }) {
  const r = await fetch(`${BASE()}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY()}` },
    body: JSON.stringify({
      model: MODEL(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      enable_search: search,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(300000),
  });
  const j = await r.json();
  const content = j.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { raw: content };
  }
}

export async function* qwenStream({ system, user, search = false }) {
  const r = await fetch(`${BASE()}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY()}` },
    body: JSON.stringify({
      model: MODEL(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      enable_search: search,
      stream: true,
    }),
  });
  if (!r.ok) throw new Error("Qwen stream HTTP " + r.status);
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {}
    }
  }
}

export async function qwenStreamJSON({ system, user, search = false, timeout = 300000 }) {
  const r = await fetch(`${BASE()}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY()}` },
    body: JSON.stringify({
      model: MODEL(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      enable_search: search,
      stream: true,
    }),
    signal: timeout > 0 ? AbortSignal.timeout(timeout) : undefined,
  });
  if (!r.ok) throw new Error("Qwen stream HTTP " + r.status);
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";
  async function* generate() {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            yield { token: delta, accumulated: full };
          }
        } catch {}
      }
    }
  }
  return { stream: generate(), getAccumulated: () => full };
}

export function computeForecast() {
  const a = {
    price_per_unit: 15,
    cogs_per_unit: 6,
    units_per_month: 1000,
    fixed_costs_month: 8000,
    monthly_growth_rate: 0.05,
    months: 12,
    starting_cash: 20000,
  };
  let units = a.units_per_month;
  let cash = a.starting_cash;
  const rows = [];
  for (let m = 1; m <= a.months; m++) {
    const revenue = units * a.price_per_unit;
    const gross = revenue - units * a.cogs_per_unit;
    const net = gross - a.fixed_costs_month;
    cash += net;
    rows.push({
      month: m,
      units: Math.round(units),
      revenue: Math.round(revenue),
      gross_profit: Math.round(gross),
      net_profit: Math.round(net),
      cash_end: Math.round(cash),
    });
    units *= 1 + a.monthly_growth_rate;
  }
  const c = a.price_per_unit - a.cogs_per_unit;
  return { assumptions: a, rows, break_even_units: c > 0 ? Math.ceil(a.fixed_costs_month / c) : null };
}
