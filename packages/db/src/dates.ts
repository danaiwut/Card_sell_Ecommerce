const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export function serializeDates(record: Record<string, unknown>, dateFields: readonly string[]): Record<string, unknown> {
  const out = { ...record };
  for (const field of dateFields) {
    const value = out[field];
    if (value instanceof Date) {
      out[field] = value.toISOString();
    }
  }
  return out;
}

export function hydrateDates(record: Record<string, unknown>, dateFields: readonly string[]): Record<string, unknown> {
  const out = { ...record };
  for (const field of dateFields) {
    const value = out[field];
    if (typeof value === "string" && ISO_RE.test(value)) {
      out[field] = new Date(value);
    }
  }
  return out;
}

export function dayKey(value: Date | string): string {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
