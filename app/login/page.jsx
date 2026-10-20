"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LoaderCircle, Mail, LockKeyhole, AlertCircle } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

const fieldClass = "block h-11 w-full rounded-lg border border-stone-300 bg-white pl-10 pr-11 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-wood-500 focus:ring-2 focus:ring-wood-500/10 dark:border-stone-700 dark:bg-stone-950/50 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-wood-400";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Unable to sign in. Please try again.");
      router.replace("/app");
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to sign in.");
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Woodpecker"
      description="Continue your business research and pick up where your agents left off."
      footer={<>New to Woodpecker? <Link href="/register" className="font-semibold text-wood-600 hover:underline dark:text-wood-300">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-2 block text-xs font-semibold text-stone-700 dark:text-stone-200">Email address</label>
          <div className="relative">
            <Mail size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 text-stone-400" />
            <input id="login-email" className={fieldClass} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
        </div>
        <div>
          <label htmlFor="login-password" className="mb-2 block text-xs font-semibold text-stone-700 dark:text-stone-200">Password</label>
          <div className="relative">
            <LockKeyhole size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 text-stone-400" />
            <input id="login-password" className={fieldClass} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}
        <button type="submit" disabled={submitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-wood-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-wood-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-500/40 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? <><LoaderCircle size={17} className="animate-spin" /> Signing in...</> : <>Sign in <ArrowRight size={17} /></>}
        </button>
      </form>
    </AuthShell>
  );
}
