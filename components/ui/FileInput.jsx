import React from "react";

export default function FileInput({
  id,
  label,
  helper,
  error,
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block font-medium">
        {label}
      </label>
      <input
        id={id}
        type="file"
        className="block w-full rounded-md border border-border bg-card p-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground hover:file:bg-blue-700 disabled:file:opacity-50"
        {...props}
      />
      <p className="mt-1 text-xs text-text/60">
        {error ? <span className="text-red-600">{error}</span> : helper}
      </p>
    </div>
  );
}
