import { useState, useCallback } from "react";

export function useToast() {
  const [message, setMessage] = useState(" ");
  const show = useCallback((msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(" "), 2000);
  }, []);

  const Toast = () =>
    message.trim() ? (
      <div role="status" className="toast">
        {message}
      </div>
    ) : null;

  return { show, Toast };
}
