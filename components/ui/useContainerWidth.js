export default function useContainerWidth(ref, deps = []) {
  return (() => {
    // minimal inline hook to avoid external deps
    let width = 0;
    return function useMeasuredWidth() {
      const React = require("react");
      const { useEffect, useState } = React;
      const [w, setW] = useState(width);
      useEffect(() => {
        if (!ref.current) return;
        const ro = new ResizeObserver(entries => {
          for (const e of entries) {
            const cw = e.contentRect?.width ?? ref.current?.offsetWidth ?? 0;
            width = cw;
            setW(cw);
          }
        });
        ro.observe(ref.current);
        return () => ro.disconnect();
      }, deps); // eslint-disable-line react-hooks/exhaustive-deps
      return w;
    };
  })();
}
