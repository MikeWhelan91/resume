import React, { useEffect, useState } from "react";

export default function ToggleTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <button type="button" aria-label="Toggle dark mode" onClick={toggle}>
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
