import { useState, useCallback } from "react";

export function useToast() {
  const [message, setMessage] = useState(" ");
  const show = useCallback((msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(" "), 2000);
  }, []);

  const Toast = () =>
    message.trim() ? (
      <div
        role="status"
        className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded bg-text px-4 py-2 text-card shadow"
      >
        {message}
      </div>
    ) : null;

  return { show, Toast };
}
