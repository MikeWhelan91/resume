import { useMemo, useRef } from "react";
import useContainerWidthFactory from "./useContainerWidth";
import A4Preview from "./A4Preview";

const TARGET_RENDERED_WIDTH = 740; // what we want visually on desktop
const INNER_WIDTH = 794; // A4 inner width in px

export default function ResponsiveA4Preview({ children, className = "" }) {
  const containerRef = useRef(null);
  const useWidth = useContainerWidthFactory(containerRef);
  const containerWidth = useWidth();

  // base scale for target size
  const targetScale = TARGET_RENDERED_WIDTH / INNER_WIDTH;
  // if container is tighter, shrink to fit; leave a small gutter
  const maxUsable = Math.max(0, containerWidth - 24); // 24px padding/gutter
  const fitScale = maxUsable > 0 ? Math.min(targetScale, maxUsable / INNER_WIDTH) : targetScale;

  const scale = useMemo(() => {
    // clamp between 0.5 and 1.0 for sanity
    return Math.max(0.5, Math.min(1.0, fitScale || targetScale));
  }, [fitScale]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <A4Preview scale={scale}>
        {children}
      </A4Preview>
    </div>
  );
}
