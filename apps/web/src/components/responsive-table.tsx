import type { ReactNode } from "react";

export function ResponsiveTable({ children }: { children: ReactNode }) {
  return <div className="table-scroll">{children}</div>;
}
