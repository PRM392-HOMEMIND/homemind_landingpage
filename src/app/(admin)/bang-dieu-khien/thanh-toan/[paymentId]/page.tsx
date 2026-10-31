import { PaymentDetail } from "@/features/payments/payment-pages";
export default async function Page({
  params,
}: PageProps<"/bang-dieu-khien/thanh-toan/[paymentId]">) {
  const { paymentId } = await params;
  return <PaymentDetail key={paymentId} paymentId={paymentId} />;
}
