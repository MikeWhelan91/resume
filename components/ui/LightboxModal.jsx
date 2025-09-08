import { useEffect, useState } from "react";

export default function LightboxModal({ open, onClose, children, onPrev, onNext, canPrev, canNext, pageLabel }) {
  const [scale, setScale] = useState(1);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    if (!open) return;

    function updateScale() {
      const vw = window.innerWidth - 32;
      const vh = window.innerHeight - 32;
      const s = Math.min(vw / 794, vh / 1123, 1);
      setFitScale(s);
      setScale(s);
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [open]);

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

  function toggleZoom(e) {
    e.stopPropagation();
    setScale(s => (s === 1 ? fitScale : 1));
  }

  function stop(e) {
    e.stopPropagation();
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={e => { stop(e); onClose(); }}
        className="absolute top-4 right-4 text-white/90 text-xl px-3 py-1 rounded hover:bg-white/10"
        aria-label="Close"
      >
        ✕
      </button>
      {canPrev && (
        <button
          onClick={e => { stop(e); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/90 text-2xl px-3 py-2 rounded hover:bg-white/10"
          aria-label="Previous"
        >
          ←
        </button>
      )}
      {canNext && (
        <button
          onClick={e => { stop(e); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/90 text-2xl px-3 py-2 rounded hover:bg-white/10"
          aria-label="Next"
        >
          →
        </button>
      )}
      <div
        className="relative bg-white shadow-2xl"
        style={{ width: 794 * scale, height: 1123 * scale }}
        onClick={toggleZoom}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
      </div>
      {pageLabel && (
        <div className="absolute bottom-4 inset-x-0 text-center text-white/80 text-sm">{pageLabel}</div>
      )}
    </div>
  );
}
