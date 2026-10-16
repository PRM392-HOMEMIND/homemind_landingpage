import UsagePage from "@/features/usage/usage-page";
export default async function Page({
  searchParams,
}: PageProps<"/bang-dieu-khien/su-dung-ai">) {
  const query = await searchParams;
  const initial = {
    ...(typeof query.userId === "string" ? { userId: query.userId } : {}),
    ...(typeof query.workspaceId === "string"
      ? { workspaceId: query.workspaceId }
      : {}),
  };
  return <UsagePage key={JSON.stringify(initial)} initial={initial} />;
}
