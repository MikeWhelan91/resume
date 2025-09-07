export default function MainShell({ left, right }) {
  return (
    <div className="max-w-[1360px] mx-auto p-4 lg:flex gap-6">
      <aside className="lg:w-80 w-full lg:sticky lg:top-4 mb-6 lg:mb-0">{left}</aside>
      <div className="flex-1">{right}</div>
    </div>
  );
}
