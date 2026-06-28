import Link from "next/link";

export function SectionHeader({
  title,
  href,
  action,
}: {
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      {href && (
        <Link href={href} className="text-xs font-semibold tracking-wider text-ink/60 hover:text-ink">
          {action ?? "VIEW ALL"} →
        </Link>
      )}
    </div>
  );
}
