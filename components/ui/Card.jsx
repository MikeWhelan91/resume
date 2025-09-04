import React from "react";

export function Card({ className = "", ...props }) {
  return <div className={["card", className].join(" ")} {...props} />;
}

export function CardHeader({ className = "", ...props }) {
  return <div className={["card-header", className].join(" ")} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return <h2 className={["card-title", className].join(" ")} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={["card-content", className].join(" ")} {...props} />;
}
