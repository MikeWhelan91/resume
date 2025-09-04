import React from "react";

export default function Textarea({
  id,
  label,
  value,
  onChange,
  helper,
  error,
  showCount = false,
  className = "",
  ...props
}) {
  const count = value ? value.length : 0;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block font-medium">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        className="w-full resize-y rounded-md border border-border bg-card p-3 text-sm focus:border-primary"
        {...props}
      />
      <div className="mt-1 flex justify-between text-xs text-text/60">
        <span>{error ? <span className="text-red-600">{error}</span> : helper}</span>
        {showCount && <span>{count}</span>}
      </div>
    </div>
  );
}
