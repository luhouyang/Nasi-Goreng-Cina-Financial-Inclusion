import { cn } from "@/lib/cn";

const variants = {
  default:
    "bg-stone-100 text-stone-700 " + "dark:bg-stone-800 dark:text-stone-300",

  running:
    "bg-orange-50 text-orange-700 " +
    "dark:bg-orange-950/40 dark:text-orange-300",

  success:
    "bg-emerald-50 text-emerald-700 " +
    "dark:bg-emerald-950/40 dark:text-emerald-300",

  error: "bg-red-50 text-red-700 " + "dark:bg-red-950/40 dark:text-red-300",

  brand: "bg-wood-50 text-wood-700 " + "dark:bg-wood-900/30 dark:text-wood-300",
};

export default function Badge({ children, variant = "default", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "rounded-md px-2 py-1",
        "text-[11px] font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
