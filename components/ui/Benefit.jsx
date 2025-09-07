import Icon from './Icon';

export default function Benefit({ icon, heading, body }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 px-4">
      <Icon name={icon} size={32} />
      <h3 className="font-semibold">{heading}</h3>
      <p className="text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}
