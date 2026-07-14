import { AccountSidebar } from "./account-sidebar";

export function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <AccountSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
