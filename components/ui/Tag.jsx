export default function Tag({ children }) {
  return (
    <span className="inline-block px-3 py-1 text-sm rounded-full bg-[var(--rule)] text-[var(--ink)]">
      {children}
    </span>
  );
}
