import { redirect } from "next/navigation";

export default async function AccountSaleDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/account/purchases/${id}`);
}
