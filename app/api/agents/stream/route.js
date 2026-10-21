import { who } from "@/lib/auth";
import { db } from "@/lib/mongo";
import { embed, vectorSearch, qwenJSON, qwenStream, qwenStreamJSON, computeForecast } from "@/lib/qwen";
import { uid } from "@/lib/blocks";
import { langInstruction } from "@/lib/lang";

export const dynamic = "force-dynamic";
const QBASE = () => process.env.QWEN_BASE || "https://maas.qwencloudapi.com/compatible-mode/v1";

function smartTitle(str, maxLen = 100) {
  if (!str) return "Untitled";
  if (str.length <= maxLen) return str;
  const sliced = str.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced) + "...";
}

function dedupe(items) {
  const seen = new Set();
  return (items || []).filter((it) => {
    const t = (typeof it === "string" ? it : it?.title || "").toString().trim().toLowerCase();
    if (!t || seen.has(t)) return false;
    seen.add(t);
    return true;
  });
}

// Helper to attach sources as chips to the first block of a section
function attachSources(blocks, sources) {
  if (sources && sources.length > 0 && blocks.length > 0) {
    blocks[0].meta = blocks[0].meta || {};
    blocks[0].meta.sources = sources.filter((s) => s && s.url);
  }
  return blocks;
}

function legalBlocks(legal) {
  const out = [];
  (legal.cards || []).forEach((c) => {
    out.push({ id: uid(), type: "heading", text: c.title || "Section" });
    if (c.summary) out.push({ id: uid(), type: "paragraph", text: c.summary });
    dedupe(c.items).forEach((it) => {
      if (typeof it === "string") out.push({ id: uid(), type: "action", text: it, meta: { done: false } });
      else
        out.push({
          id: uid(),
          type: "action",
          text: it.title || "Action",
          meta: { done: false, target: it.target || "", detail: it.detail || "" },
        });
    });
  });
  return attachSources(out, legal.sources);
}

function strategyBlocks(s) {
  const out = [];
  if (s?.swot) out.push({ id: uid(), type: "swot", text: "SWOT Analysis", meta: { data: s.swot } });
  if (s?.porter) out.push({ id: uid(), type: "porter", text: "Porter's Five Forces", meta: { data: s.porter } });
  if (s?.bmc) out.push({ id: uid(), type: "bmc", text: "Business Model Canvas", meta: { data: s.bmc } });
  return attachSources(out, s.sources);
}

function marketBlock(m) {
  if (!m || !(m.competitors || m.suppliers || m.customers)) return [];
  const out = [{ id: uid(), type: "market", text: "Market Intelligence", meta: { data: m } }];
  return attachSources(out, m.sources);
}

function pitchBlocks(p) {
  if (!p?.pitch) return [];
  const out = [
    { id: uid(), type: "heading", text: "Elevator pitch" },
    { id: uid(), type: "paragraph", text: p.pitch },
  ];
  return attachSources(out, p.sources);
}

function refBlocks(evidence) {
  return evidence.map((x, i) => ({
    id: uid(),
    type: "reference",
    text: x.title,
    meta: { quote: x.chunk_text, citeIndex: i + 1 },
  }));
}

function tryParseJSON(text) {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = match ? match[0] : text;
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

export async function POST(req) {
  const user = await who();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { prompt, docId, lang } = await req.json();
  const L = langInstruction(lang);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event, data) => {
        try {
          controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      const serverBlocks = [];
      const replaceBlock = (id, blocks) => {
        const idx = serverBlocks.findIndex((b) => b.id === id);
        if (idx !== -1) serverBlocks.splice(idx, 1, ...blocks);
        else serverBlocks.push(...blocks);
        send("replace_block", { id, blocks });
      };

      try {
        send("stage", { msg: "🧠 Embedding idea with local model…" });
        const vector = await embed(prompt).catch(() => null);
        send("stage", { msg: "📚 Vector-searching your document store…" });
        const evidence = await vectorSearch(vector, 4).catch(() => []);
        send("stage", { msg: `📚 ${evidence.length} grounded chunks. ⚡ Launching agents in parallel…` });

        const evText = JSON.stringify(evidence.map((x) => ({ title: x.title, text: (x.chunk_text || "").slice(0, 800) })));

        const researchStreamId = uid();
        const legalStreamId = uid();
        const strategyStreamId = uid();
        const marketStreamId = uid();
        const financeStreamId = uid();
        const pitchStreamId = uid();
        const refsStreamId = uid();

        const placeholders = [
          { id: researchStreamId, type: "streaming", text: "Executive Summary", meta: { agent: "research", raw: "" } },
          { id: legalStreamId, type: "streaming", text: "Legal & Compliance", meta: { agent: "legal", raw: "" } },
          { id: strategyStreamId, type: "streaming", text: "Strategy Analysis", meta: { agent: "strategy", raw: "" } },
          { id: marketStreamId, type: "streaming", text: "Market Intelligence", meta: { agent: "market", raw: "" } },
          { id: financeStreamId, type: "streaming", text: "Financial Forecast", meta: { agent: "finance", raw: "" } },
          { id: pitchStreamId, type: "streaming", text: "Elevator Pitch", meta: { agent: "pitch", raw: "" } },
          { id: refsStreamId, type: "streaming", text: "References & Sources", meta: { agent: "refs", raw: "" } },
        ];

        placeholders.forEach((p) => {
          serverBlocks.push(p);
          send("block", { block: p });
        });

        const runAgent = async (id, agentName, system, userPrompt, search, transformFn) => {
          try {
            if (agentName === "research") {
              let text = "";
              for await (const tok of qwenStream({ system: system + L, user: userPrompt, search })) {
                text += tok;
                send("stream_update", { id, text });
              }
              replaceBlock(id, [{ id: uid(), type: "paragraph", text }]);
            } else {
              const { stream, getAccumulated } = await qwenStreamJSON({ system: system + L, user: userPrompt, search, timeout: 90000 });
              for await (const { accumulated } of stream) send("stream_update", { id, text: accumulated });
              const final = tryParseJSON(getAccumulated());
              replaceBlock(id, transformFn(final || {}));
            }
          } catch (e) {
            send("stage", { msg: `⚠️ ${agentName} agent failed: ${e?.message || e}` });
            replaceBlock(id, [{ id: uid(), type: "paragraph", text: `️ ${agentName} skipped due to timeout or error.` }]);
          }
        };

        const researchP = runAgent(
          researchStreamId,
          "research",
          "You are the Research Agent of Woodpecker. Write a 3-6 sentence executive summary in plain prose. Cite evidence inline as [1], [2], [3]. Where relevant, name 2-4 REAL companies or organizations concretely. No JSON, no markdown.",
          `Business idea: ${prompt}\nEvidence:\n${evidence.map((x, i) => `[${i + 1}] ${x.title}: ${(x.chunk_text || "").slice(0, 800)}`).join("\n")}`,
          false,
          null,
        );

        const legalP = runAgent(
          legalStreamId,
          "legal",
          "You are the Legal & Compliance Agent of Woodpecker (Malaysia/ASEAN). Return JSON only.",
          `Business idea: ${prompt}\nEvidence: ${evText}\nReturn JSON: {"cards":[{"id":"legal","title":"Legal & Compliance","summary":"","items":[{"title":"","target":"","detail":""}]},{"id":"incentives","title":"Grants & Incentives","summary":"","items":[{"title":"","target":"","detail":""}]}],"sources":[{"title":"","url":""}]}\nRules: 4-6 UNIQUE non-overlapping items per card. Include 3-5 relevant authoritative sources (government sites, legal databases) with title and url.`,
          true,
          legalBlocks,
        );

        const strategyP = runAgent(
          strategyStreamId,
          "strategy",
          "You are the Strategy Agent of Woodpecker. Return JSON only.",
          `Business idea: ${prompt}\nEvidence: ${evText}\nReturn JSON: {"swot":{"strengths":[],"weaknesses":[],"opportunities":[],"threats":[]},"porter":{"rivalry":{"score":3,"note":""},"supplier_power":{"score":3,"note":""},"buyer_power":{"score":3,"note":""},"threat_of_entry":{"score":3,"note":""},"threat_of_substitution":{"score":3,"note":""}},"bmc":{"segments":"","value":"","channels":"","relationships":"","revenue":"","resources":"","activities":"","partners":"","costs":""},"sources":[{"title":"","url":""}]}\nInclude 3-5 relevant sources (industry reports, market research) with title and url.`,
          true,
          strategyBlocks,
        );

        const marketP = runAgent(
          marketStreamId,
          "market",
          "You are the Market Intelligence Agent of Woodpecker. Return JSON only.",
          `Business idea: ${prompt}\nEvidence: ${evText}\nReturn JSON: {"competitors":[{"name":"","note":"","url":""}],"suppliers":[{"name":"","note":"","url":""}],"customers":[{"name":"","note":""}],"sources":[{"title":"","url":""}]}\nList 3-5 REAL companies per list with canonical website urls. Include 3-5 relevant market research sources with title and url.`,
          true,
          marketBlock,
        );

        const financeP = runAgent(
          financeStreamId,
          "finance",
          "You are the Financial Analyst Agent. Return STRICT JSON ONLY. No markdown.",
          `Business idea: ${prompt}\nEvidence: ${evText}\nGenerate a realistic 12-month financial projection based on industry benchmarks for this specific business in Malaysia/ASEAN. Return JSON: {"assumptions": {"price_per_unit": number, "cogs_per_unit": number, "units_per_month": number, "fixed_costs_month": number, "monthly_growth_rate": number, "starting_cash": number}, "rows": [{"month": 1, "units": number, "revenue": number, "gross_profit": number, "net_profit": number, "cash_end": number}, ... 12 months], "break_even_units": number, "sources":[{"title":"","url":""}]}. Calculate the rows mathematically from the assumptions. Include 3-5 relevant financial benchmark sources with title and url.`,
          true,
          (final) => {
            const f = final || computeForecast();
            const assumptionsText = `**Assumptions:** Price/unit: $${f.assumptions.price_per_unit}, COGS/unit: $${f.assumptions.cogs_per_unit}, Starting units/mo: ${f.assumptions.units_per_month}, Fixed costs/mo: $${f.assumptions.fixed_costs_month}, Growth: ${(f.assumptions.monthly_growth_rate * 100).toFixed(0)}%.`;
            const blocks = [
              { id: uid(), type: "paragraph", text: assumptionsText },
              { id: uid(), type: "forecast", text: "Financial projection", meta: { forecast: f } },
            ];
            return attachSources(blocks, f.sources);
          },
        );

        const pitchP = runAgent(
          pitchStreamId,
          "pitch",
          "You are the Pitch Agent of Woodpecker. Return JSON only.",
          `Business idea: ${prompt}\nEvidence: ${evText}\nReturn JSON: {"pitch":"","sources":[{"title":"","url":""}]}\nInclude 3-5 relevant sources (successful pitch examples, investor insights) with title and url.`,
          false,
          pitchBlocks,
        );

        const sourcesP = (async () => {
          try {
            const r = await fetch(`${QBASE()}/responses`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.QWEN_API_KEY}` },
              body: JSON.stringify({
                model: "qwen3.7-flash",
                input: `List 4-6 authoritative current web sources (title + url) about this market: ${prompt}. Use web_search. Return JSON only: {"sources":[{"title":"","url":""}]}`,
                tools: [{ type: "web_search" }],
              }),
              signal: AbortSignal.timeout(300000),
            });
            const j = await r.json();
            let src = [];
            try {
              src = JSON.parse(j.output_text || "{}").sources || [];
            } catch {}
            if (!src.length)
              src = (j.output || [])
                .filter((o) => o.type === "web_search_call")
                .flatMap((o) => (o.action && o.action.sources) || [])
                .map((s) => ({ title: s.title || s.url, url: s.url }));
            return src.filter((s) => s && s.url);
          } catch (e) {
            console.error("Sources agent error:", e);
            return [];
          }
        })();

        send("stage", { msg: "⏳ Waiting for all agents to finish…" });

        await Promise.all([researchP, legalP, strategyP, marketP, financeP, pitchP, sourcesP]);

        const sources = await sourcesP;
        const refBlocksFinal = refBlocks(evidence); // Only grounded evidence remains as full blocks
        replaceBlock(refsStreamId, refBlocksFinal);

        send("stage", { msg: "✅ Document complete — autosaved." });

        if (!docId) {
          const finalBlocks = serverBlocks.filter((b) => b.type !== "streaming");
          const ins = await db()
            .collection("documents")
            .insertOne({
              userId: user.uid,
              title: smartTitle(prompt, 100),
              blocks: finalBlocks,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          send("result", { docId: ins.insertedId.toString() });
        }
        send("done", {});
      } catch (e) {
        send("error", { message: e.message });
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
