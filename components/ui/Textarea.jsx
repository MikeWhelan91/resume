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
      <label htmlFor={id}>{label}</label>
      <textarea id={id} value={value} onChange={onChange} {...props} />
      <div className="helper-row">
        <span className={error ? "error" : ""}>{error ? error : helper}</span>
        {showCount && <span>{count}</span>}
      </div>
    </div>
  );
}
