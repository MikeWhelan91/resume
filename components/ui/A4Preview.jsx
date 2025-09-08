import { useMemo } from "react";
export default function A4Preview({ children, scale = 0.72, className = "" }) {
  const innerStyle = useMemo(
    () => ({
      width: 794,
      height: 1123,
      transform: `scale(${scale})`,
    }),
    [scale]
  );
  const outerStyle = useMemo(
    () => ({
      width: 794 * scale,
      height: 1123 * scale,
    }),
    [scale]
  );
  return (
    <div className={`relative overflow-hidden a4-outer ${className}`} style={outerStyle}>
      <div
        className="origin-top-left bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_10px_25px_rgba(0,0,0,0.08)]"
        style={innerStyle}
      >
        <style>{`
          .a4-scope * { box-sizing: border-box; }
          .a4-scope img, .a4-scope canvas, .a4-scope svg, .a4-scope iframe, .a4-scope video {
            max-width: none !important;
            width: auto;
            height: auto;
          }
          @media print {
            .a4-outer {
              width: 794px !important;
              height: 1123px !important;
              overflow: visible !important;
            }
          }
        `}</style>
        <div className="a4-scope w-full h-full">{children}</div>
      </div>
    </div>
  );
}
