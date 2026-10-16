import { NotificationDetail } from "@/features/notifications/notification-pages";
export default async function Page({
  params,
}: PageProps<"/bang-dieu-khien/thong-bao/[notificationId]">) {
  const { notificationId } = await params;
  return (
    <NotificationDetail key={notificationId} notificationId={notificationId} />
  );
}
