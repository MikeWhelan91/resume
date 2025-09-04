import React from "react";

export default function Skeleton({ className = "" }) {
  return <div className={["skeleton", className].join(" ")} />;
}
