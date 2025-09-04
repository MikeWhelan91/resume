import React from "react";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-blue-700 dark:hover:bg-blue-500",
  outline: "border border-border bg-card text-text hover:bg-border/20",
  subtle:  "bg-border/20 text-text hover:bg-border/40",
};

export default function Button({ children, variant="primary", loading=false, className="", ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={[
        "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium",
        "transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant] ?? variants.primary,
        className
      ].join(" ")}
    >
      {children}
    </button>
  );
}
