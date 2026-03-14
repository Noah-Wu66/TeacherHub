import { notFound, redirect } from "next/navigation";
import { getToolById } from "@/lib/teacher-tools/tools";

type ToolPageProps = {
  params: Promise<{ toolId: string }>;
};

export default async function ToolRedirectPage({ params }: ToolPageProps) {
  const { toolId } = await params;
  const tool = getToolById(toolId);

  if (!tool) {
    notFound();
  }

  redirect(`/teacher-tools/tools?view=${tool.viewMode}&cube=${tool.cubeMode}`);
}
