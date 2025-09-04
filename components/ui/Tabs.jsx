import React, { createContext, useContext, useState } from "react";

const TabsContext = createContext();

export function Tabs({ defaultValue, children }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      {children}
    </TabsContext.Provider>
  );
}

export function TabList({ className = "", ...props }) {
  return (
    <div
      role="tablist"
      className={`flex border-b border-border ${className}`}
      {...props}
    />
  );
}

export function Tab({ value, children, className = "" }) {
  const { value: active, setValue } = useContext(TabsContext);
  const selected = active === value;
  return (
    <button
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={() => setValue(value)}
      className={`h-10 px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring ${
        selected
          ? "border-b-2 border-primary text-primary"
          : "text-text hover:text-primary"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children, className = "" }) {
  const { value: active } = useContext(TabsContext);
  if (active !== value) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
