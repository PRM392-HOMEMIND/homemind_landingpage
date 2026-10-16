import { CustomerDetail } from "@/features/customers/customer-pages";
export default async function Page({
  params,
}: PageProps<"/bang-dieu-khien/khach-hang/[userId]">) {
  const { userId } = await params;
  return <CustomerDetail key={userId} userId={userId} />;
}
