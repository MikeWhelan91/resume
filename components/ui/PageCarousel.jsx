import { useEffect } from "react";
import A4Preview from "./A4Preview";

export default function PageCarousel({ title, pages, scale = 0.72, index, setIndex, onOpenLightbox }) {
  const count = Array.isArray(pages) ? pages.length : 0;
  const canPrev = index > 0;
  const canNext = index < count - 1;

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft" && canPrev) setIndex(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight" && canNext) setIndex(i => Math.min(count - 1, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canPrev, canNext, count, setIndex]);

  if (!count) return <div className="border rounded-lg p-6 text-sm text-zinc-500">No pages</div>;

  return (
    <div className="relative">
      {title && <div className="text-sm font-medium mb-3">{title}</div>}

      {canPrev && (
        <button
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 px-2 py-1 bg-white/80 border rounded"
        >←</button>
      )}
      {canNext && (
        <button
          onClick={() => setIndex(i => Math.min(count - 1, i + 1))}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 px-2 py-1 bg-white/80 border rounded"
        >→</button>
      )}

      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-600">
        {index + 1} / {count}
      </div>

      <div className="cursor-zoom-in" onClick={onOpenLightbox}>
        <A4Preview scale={scale}>{pages[index]}</A4Preview>
      </div>
    </div>
  );
}
