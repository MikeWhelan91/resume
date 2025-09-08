import { useEffect } from "react";
export default function LightboxModal({ open, onClose, children, onPrev, onNext, canPrev, canNext, pageLabel }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft" && canPrev) onPrev?.();
      if (e.key === "ArrowRight" && canNext) onNext?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, canPrev, canNext, onClose, onPrev, onNext]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 text-white/90 text-xl px-3 py-1 rounded hover:bg-white/10" aria-label="Close">✕</button>
      {canPrev && <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/90 text-2xl px-3 py-2 rounded hover:bg-white/10" aria-label="Previous">←</button>}
      {canNext && <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/90 text-2xl px-3 py-2 rounded hover:bg-white/10" aria-label="Next">→</button>}
      <div className="relative bg-white shadow-2xl">{children}</div>
      {pageLabel && <div className="absolute bottom-4 inset-x-0 text-center text-white/80 text-sm">{pageLabel}</div>}
    </div>
  );
}
