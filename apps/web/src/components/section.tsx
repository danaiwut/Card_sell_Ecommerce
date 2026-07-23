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
    <div className="mb-8 flex items-center justify-between">
      <h2 className="text-[32px] font-black uppercase tracking-tight sm:text-[48px]">{title}</h2>
      {href && (
        <Link
          href={href}
          className="rounded-full border border-black/10 px-6 py-3 text-sm font-medium hover:border-black/30"
        >
          {action ?? "View All"}
        </Link>
      )}
    </div>
  );
}
