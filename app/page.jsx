import Link from "next/link";
import { Feather, ArrowRight, CheckCircle2, PanelsTopLeft, ChartNoAxesCombined } from "lucide-react";
import { who } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await who();
  return (
    <main className="min-h-screen bg-[#F7F5F0] text-stone-900 dark:bg-[#171716] dark:text-stone-100">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-7 sm:px-8">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-wood-500 text-white"><Feather size={21}/></span>
          <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">woodpecker<span className="text-wood-500">.</span></span>
        </Link>
        <Link href={user ? "/app" : "/login"} className="text-xs font-semibold text-stone-600 no-underline hover:text-wood-600 dark:text-stone-300">{user ? "Open workspace" : "Sign in"}</Link>
      </div>
      <section className="mx-auto grid min-h-[70vh] w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-2 lg:pt-8">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.2em] text-wood-600 dark:text-wood-300">An organized way to think bigger</p>
          <h1 className="m-0 max-w-xl text-5xl font-semibold leading-[1.1] tracking-[-.055em] sm:text-6xl">From an idea to <span className="text-wood-500">a real plan.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-stone-600 dark:text-stone-400">Make informed business decisions with coordinated research, strategy, financial projections and actionable recommendations.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={user ? "/app" : "/register"} className="inline-flex h-11 items-center gap-2 rounded-lg bg-wood-500 px-5 text-sm font-semibold text-white no-underline hover:bg-wood-600">{user ? "Go to workspace" : "Get started"}<ArrowRight size={17}/></Link>
            {!user && <Link href="/login" className="inline-flex h-11 items-center rounded-lg border border-stone-300 px-5 text-sm font-semibold text-stone-800 no-underline hover:bg-stone-100 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800">Sign in</Link>}
          </div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/[0.04] dark:border-stone-800 dark:bg-stone-900 sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-stone-200 pb-5 dark:border-stone-800"><div className="flex items-center gap-2 text-sm font-semibold"><PanelsTopLeft size={17} className="text-wood-500"/> Business workspace</div><span className="rounded-md bg-wood-50 px-2 py-1 text-[11px] text-wood-700 dark:bg-wood-900/30 dark:text-wood-300">Live workflow</span></div>
          {["Research and analysis", "Strategy and positioning", "Financial planning"].map((name, i) => <div key={name} className="mb-3 flex items-center gap-4 rounded-xl border border-stone-200 p-4 dark:border-stone-700"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">{i === 2 ? <ChartNoAxesCombined size={18}/> : <CheckCircle2 size={18}/>}</span><span className="flex-1 text-sm font-medium">{name}</span><span className="text-xs text-stone-500 dark:text-stone-400">{i < 2 ? "Ready" : "In progress"}</span></div>)}
          <p className="mb-0 mt-5 text-xs text-stone-500 dark:text-stone-400">The workspace shows agent progress alongside your document.</p>
        </div>
      </section>
    </main>
  );
}
