import { cn } from "@/lib/cn";

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200",
        "bg-white text-stone-900",
        "dark:border-stone-800",
        "dark:bg-stone-900 dark:text-stone-100",
        "shadow-sm shadow-stone-900/[0.03]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
