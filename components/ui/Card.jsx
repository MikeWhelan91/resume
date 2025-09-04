import React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-lg border border-border bg-card text-text shadow-sm ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return (
    <div className={`border-b border-border p-4 ${className}`} {...props} />
  );
}

export function CardTitle({ className = "", ...props }) {
  return <h2 className={`text-lg font-semibold ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={`p-4 ${className}`} {...props} />;
}
