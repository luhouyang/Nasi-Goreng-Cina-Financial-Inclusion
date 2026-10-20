"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  FileText,
  Plus,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

export default function Dashboard({ initial }) {
  const [docs] = useState(initial);
  const [idea, setIdea] = useState("");
  const [running, setRunning] = useState(false);
  const router = useRouter();

  async function newFromIdea() {
    if (!idea.trim() || running) return;

    setRunning(true);

    try {
      const response = await fetch("/api/docs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: idea,
          blocks: [],
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create document");
      }

      const result = await response.json();

      router.push(`/app/doc/${result.id}?run=${encodeURIComponent(idea)}`);
    } catch (error) {
      alert("Failed: " + error.message);
      setRunning(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 md:px-10">
      <div className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-wood-500">
          Your workspace
        </p>

        <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Build something worthwhile.
        </h1>

        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          Explore your business ideas with structured research, financial
          analysis, strategy and market intelligence.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
        <div className="border-b border-[var(--border)] px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)]">
              <Plus size={18} />
            </span>
            <div>
              <h2 className="m-0 text-base font-semibold">New business plan</h2>
              <p className="m-0 mt-1 text-xs text-[var(--muted)]">
                Start with a concept. Woodpecker will build the analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <label
            htmlFor="business-idea"
            className="mb-2 block text-xs font-medium text-[var(--text)]"
          >
            Describe your business idea
          </label>

          <textarea
            id="business-idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={5}
            placeholder="For example: A subscription-based platform that helps local businesses manage their inventory..."
            className="w-full resize-y rounded-xl border border-[var(--border-2)] bg-[var(--bg)] p-4 text-sm leading-6 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-wood-500 focus:ring-2 focus:ring-wood-500/10"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="m-0 flex items-center gap-2 text-xs text-[var(--muted)]">
              <Sparkles size={14} className="text-wood-500" />
              Multi-agent business analysis
            </p>

            <button
              onClick={newFromIdea}
              disabled={!idea.trim() || running}
              className="flex items-center gap-2 rounded-lg bg-wood-500 px-5 py-3 text-xs font-semibold text-white transition hover:bg-wood-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Generate business plan
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="m-0 text-lg font-semibold">Your documents</h2>
            <p className="m-0 mt-1 text-xs text-[var(--muted)]">
              Access and continue your business plans.
            </p>
          </div>

          <span className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)]">
            {docs.length} total
          </span>
        </div>

        {docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-2)] bg-[var(--panel)] px-6 py-16 text-center">
            <FileText
              size={30}
              strokeWidth={1.5}
              className="mx-auto mb-4 text-[var(--muted)]"
            />
            <h3 className="mb-2 text-sm font-semibold">No documents yet</h3>
            <p className="m-0 text-xs text-[var(--muted)]">
              Your generated business plans will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {docs.map((doc) => (
              <button
                key={doc._id}
                onClick={() => router.push(`/app/doc/${doc._id}`)}
                className="group flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 text-left transition hover:border-wood-500/50 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--panel-2)] text-[var(--muted)]">
                  <FileText size={19} />
                </span>

                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-semibold text-[var(--text)]">
                    {doc.title}
                  </strong>
                  <span className="mt-2 block text-xs text-[var(--muted)]">
                    Updated{" "}
                    {doc.updatedAt
                      ? new Date(doc.updatedAt).toISOString().slice(0, 10)
                      : "Recently"}
                  </span>
                </span>

                <ArrowUpRight
                  size={17}
                  className="shrink-0 text-[var(--muted)] transition group-hover:text-wood-500"
                />
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
