import Link from "next/link";
import {
  Feather,
  ArrowLeft,
  Layers3,
  ChartNoAxesCombined,
  PanelLeft,
  Check,
} from "lucide-react";

const FEATURES = [
  {
    Icon: Layers3,
    title: "Research in one place",
    detail: "Bring market, strategy and supporting evidence together.",
  },
  {
    Icon: ChartNoAxesCombined,
    title: "Structured business planning",
    detail: "Work with frameworks and practical financial forecasts.",
  },
  {
    Icon: PanelLeft,
    title: "Follow each agent",
    detail: "See live progress alongside your working document.",
  },
];

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}) {
  return (
    <main className="grid min-h-screen bg-[#F7F5F0] text-stone-900 dark:bg-[#171716] dark:text-stone-100 lg:grid-cols-[minmax(360px,0.95fr)_minmax(0,1.05fr)]">
      <aside className="relative hidden min-h-screen flex-col overflow-hidden bg-[#22201D] px-10 py-9 text-stone-100 lg:flex xl:px-16">
        <Link
          href="/"
          className="relative z-10 inline-flex w-fit items-center gap-3 text-stone-100 no-underline"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-wood-500 text-white">
            <Feather size={21} strokeWidth={1.9} />
          </span>
          <span className="text-xl font-bold tracking-tight">
            woodpecker<span className="text-[#EA8050]">.</span>
          </span>
        </Link>

        <div className="relative z-10 my-auto max-w-md py-20">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#EA8050]">
            The thinking workspace
          </p>
          <h2 className="m-0 text-4xl font-semibold leading-[1.18] tracking-[-0.045em] xl:text-5xl">
            Build with more
            <span className="block text-[#EA8050]">clarity.</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-stone-400">
            A calm, organized place to turn an idea into a researched,
            actionable business plan.
          </p>

          <div className="mt-11 space-y-6 border-t border-white/10 pt-9">
            {FEATURES.map(({ Icon, title, detail }) => (
              <div key={title} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-[#EA8050]">
                  <Icon size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <h3 className="m-0 text-sm font-medium text-stone-100">
                    {title}
                  </h3>
                  <p className="mb-0 mt-1 text-xs leading-6 text-stone-400">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-stone-500">
          <Check size={14} className="text-[#EA8050]" /> A focused workspace for
          ambitious ideas
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-52 h-[520px] w-[520px] rounded-full border border-white/[0.06]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-36 h-[390px] w-[390px] rounded-full border border-white/[0.06]"
        />
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10 lg:justify-end">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-900 no-underline dark:text-stone-100 lg:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-wood-500 text-white">
              <Feather size={19} />
            </span>
            woodpecker.
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 no-underline hover:text-wood-600 dark:text-stone-400 dark:hover:text-wood-300"
          >
            <ArrowLeft size={15} /> Home
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-10 lg:py-16">
          <div className="w-full max-w-[430px]">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-wood-600 dark:text-wood-300">
              {eyebrow}
            </p>
            <h1 className="m-0 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              {title}
            </h1>
            <p className="mb-0 mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">
              {description}
            </p>

            <div className="mt-9 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/[0.03] dark:border-stone-800 dark:bg-stone-900 sm:p-8">
              {children}
            </div>
            <div className="mt-7 text-center text-sm text-stone-600 dark:text-stone-400">
              {footer}
            </div>
            <p className="mt-12 text-center text-[11px] text-stone-400 dark:text-stone-500">
              Woodpecker · Business planning workspace
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
