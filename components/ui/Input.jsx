import { cn } from "@/lib/cn";

export const inputStyles = cn(
  "w-full rounded-lg border border-stone-300",
  "bg-white px-3 py-2.5 text-sm text-stone-900",
  "placeholder:text-stone-400",
  "outline-none transition-colors",
  "focus:border-wood-500 focus:ring-2 focus:ring-wood-500/10",
  "dark:border-stone-700 dark:bg-stone-900",
  "dark:text-stone-100 dark:placeholder:text-stone-500",
  "dark:focus:border-wood-400",
);

export function Input({ className, ...props }) {
  return <input className={cn(inputStyles, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        inputStyles,
        "min-h-24 resize-y leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
