import React, { createContext, useContext, useState } from "react";

const TabsContext = createContext();

export function Tabs({ defaultValue, children }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ className = "", ...props }) {
  return (
    <div role="tablist" className={["flex gap-4 border-b border-border", className].join(" ")} {...props} />
  );
}

export function Tab({ value, children, className = "" }) {
  const { value: active, setValue } = useContext(TabsContext);
  const selected = active === value;
  return (
    <button
      role="tab"
      aria-selected={selected}
      onClick={() => setValue(value)}
      className={[
        "h-10 px-4 text-sm font-medium -mb-px",
        selected ? "border-b-2 border-primary text-primary" : "text-text hover:text-primary",
        className
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children, className = "" }) {
  const { value: active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div className={className}>{children}</div>;
}
