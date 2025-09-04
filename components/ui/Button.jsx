import React from "react";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:bg-blue-700 dark:hover:bg-blue-500",
  outline:
    "border border-border bg-card text-text hover:bg-border/20",
  subtle: "bg-border/20 text-text hover:bg-border/40",
};

export default function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring disabled:pointer-events-none disabled:opacity-50 ${
        variants[variant] || variants.primary
      } ${className}`}
      disabled={loading || props.disabled}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
}
