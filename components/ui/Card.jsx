import React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={["rounded-2xl border border-border bg-card shadow-sm", className].join(" ")}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return <div className={["border-b border-border p-4", className].join(" ")} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return <h2 className={["text-lg font-semibold", className].join(" ")} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={["p-4", className].join(" ")} {...props} />;
}
