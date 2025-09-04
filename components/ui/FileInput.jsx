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
      <label htmlFor={id}>{label}</label>
      <input id={id} type="file" {...props} />
      <p className={error ? "error" : ""}>{error ? error : helper}</p>
    </div>
  );
}
