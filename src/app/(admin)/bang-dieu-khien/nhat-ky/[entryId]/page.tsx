import { AuditDetail } from "@/features/audit/audit-pages";
export default async function Page({
  params,
}: PageProps<"/bang-dieu-khien/nhat-ky/[entryId]">) {
  const { entryId } = await params;
  return <AuditDetail key={entryId} entryId={entryId} />;
}
