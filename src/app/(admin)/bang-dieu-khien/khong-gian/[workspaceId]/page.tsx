import { WorkspaceDetail } from "@/features/workspaces/workspace-pages";
export default async function Page({
  params,
}: PageProps<"/bang-dieu-khien/khong-gian/[workspaceId]">) {
  const { workspaceId } = await params;
  return <WorkspaceDetail key={workspaceId} workspaceId={workspaceId} />;
}
