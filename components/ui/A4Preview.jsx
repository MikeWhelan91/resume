import { useMemo } from "react";
export default function A4Preview({ children, scale = 0.72, className = "" }) {
  const style = useMemo(() => ({
    width: 794,
    height: 1123,
    transform: `scale(${scale})`,
  }), [scale]);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="origin-top-left bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_10px_25px_rgba(0,0,0,0.08)]"
        style={style}
      >
        <style>{`
          .a4-scope * { box-sizing: border-box; }
          .a4-scope img, .a4-scope canvas, .a4-scope svg, .a4-scope iframe, .a4-scope video {
            max-width: none !important;
            width: auto;
            height: auto;
          }
        `}</style>
        <div className="a4-scope w-full h-full">{children}</div>
      </div>
    </div>
  );
}
