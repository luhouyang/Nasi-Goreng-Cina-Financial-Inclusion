import Link from "next/link";
import { Feather, LogOut, LayoutDashboard } from "lucide-react";
import { who } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { T } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }) {
  const user = await who();

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-stone-900 dark:bg-[#171716] dark:text-stone-100">
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur-md dark:border-stone-800 dark:bg-[#21201E]/95 sm:px-6 lg:px-8 print:hidden">
        <div className="flex min-w-0 items-center gap-5 sm:gap-9">
          <Link href="/app" className="flex shrink-0 items-center gap-2.5 no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-wood-500 text-white">
              <Feather size={19} strokeWidth={1.9} />
            </span>
            <span className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-100">
              woodpecker<span className="text-wood-500">.</span>
            </span>
          </Link>
          <Link href="/app" className="hidden items-center gap-2 text-xs font-medium text-stone-600 no-underline transition-colors hover:text-wood-600 dark:text-stone-400 dark:hover:text-wood-300 md:inline-flex">
            <LayoutDashboard size={15} /> <T>Workspace</T>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden max-w-56 truncate text-xs text-stone-500 dark:text-stone-400 md:inline">{user?.email || "Guest"}</span>
          <LanguageToggle />
          <ThemeToggle />
          <form method="post" action="/api/auth/logout">
            <button type="submit" title="Sign out" className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800">
              <LogOut size={15} /> <span className="hidden sm:inline"><T>Sign out</T></span>
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
