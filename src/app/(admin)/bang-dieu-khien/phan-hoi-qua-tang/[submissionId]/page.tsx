import { FeedbackDetail } from "@/features/feedback-admin/Management";
export default async function Page({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  return <FeedbackDetail id={submissionId} />;
}
