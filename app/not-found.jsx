import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function NotFound() {
  return <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center text-stone-900 dark:text-stone-100"><p className="text-sm font-semibold text-wood-500">404</p><h1 className="mt-3 text-3xl font-semibold">Page not found</h1><p className="mt-3 text-sm text-stone-500 dark:text-stone-400">The page you requested could not be found.</p><Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-wood-500 px-5 py-3 text-sm font-semibold text-white no-underline hover:bg-wood-600"><ArrowLeft size={15}/> Back to home</Link></main>;
}
