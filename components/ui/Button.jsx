"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-wood-500 text-white hover:bg-wood-600 " + "border border-wood-500",

  secondary:
    "bg-white text-stone-800 border border-stone-200 " +
    "hover:bg-stone-50 dark:bg-stone-900 " +
    "dark:text-stone-100 dark:border-stone-700 " +
    "dark:hover:bg-stone-800",

  ghost:
    "text-stone-600 hover:text-stone-950 " +
    "hover:bg-stone-100 dark:text-stone-400 " +
    "dark:hover:bg-stone-800 dark:hover:text-white",

  outline:
    "border border-stone-300 bg-transparent " +
    "text-stone-800 hover:bg-stone-100 " +
    "dark:border-stone-700 dark:text-stone-200 " +
    "dark:hover:bg-stone-800",

  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  icon: "h-9 w-9 p-0",
};

const Button = forwardRef(function Button(
  {
    variant = "secondary",
    size = "md",
    className,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2",
        "rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-wood-500/40",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
