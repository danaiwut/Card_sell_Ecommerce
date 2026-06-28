export function formatBaht(value: number): string {
  return `฿${value.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`;
}

export function formatDate(iso: string, locale = "th-TH"): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
