"use client";
import { AlertCircle, RotateCcw } from "lucide-react";
export default function Error({error,reset}) {
  return <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center text-stone-900 dark:text-stone-100"><AlertCircle size={32} className="mb-4 text-wood-500"/><h1 className="text-2xl font-semibold">Something went wrong</h1><p className="mt-3 max-w-lg text-sm text-stone-500 dark:text-stone-400">{error?.message || "An unexpected error occurred."}</p><button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-wood-500 px-5 py-3 text-sm font-semibold text-white hover:bg-wood-600"><RotateCcw size={15}/> Try again</button></main>;
}
