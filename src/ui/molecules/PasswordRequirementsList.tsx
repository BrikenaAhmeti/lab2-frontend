interface PasswordRequirementsListProps {
  items: string[];
  className?: string;
}

export default function PasswordRequirementsList({
  items,
  className = '',
}: PasswordRequirementsListProps) {
  return (
    <ul className={`rounded-xl border border-border bg-surface/60 px-4 py-3 text-xs text-muted ${className}`.trim()}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
