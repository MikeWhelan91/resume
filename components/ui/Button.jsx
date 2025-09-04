import React from "react";

const variants = {
  primary: "",
  outline: "button-outline",
  subtle: "button-subtle",
};

export default function Button({ children, variant = "primary", loading = false, className = "", ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={["button", variants[variant] || "", className].join(" ")}
    >
      {children}
    </button>
  );
}
