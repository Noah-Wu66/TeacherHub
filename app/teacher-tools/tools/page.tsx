import { notFound } from "next/navigation";
import {
  DEFAULT_CUBE_MODE,
  DEFAULT_VIEW_MODE,
  getToolByConfig,
  parseCubeMode,
  parseViewMode,
} from "@/lib/teacher-tools/tools";
import RandomToolFrame from "./random-tool-frame";
import ToolAccessGuard from "@/components/platform/auth/ToolAccessGuard";

type ToolsPageProps = {
  searchParams: Promise<{
    view?: string | string[];
    cube?: string | string[];
  }>;
};

function pickFirstParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const { view, cube } = await searchParams;
  const currentViewMode = parseViewMode(pickFirstParam(view)) ?? DEFAULT_VIEW_MODE;
  const currentCubeMode = parseCubeMode(pickFirstParam(cube)) ?? DEFAULT_CUBE_MODE;
  const currentTool = getToolByConfig(currentViewMode, currentCubeMode);

  if (!currentTool) {
    notFound();
  }

  return (
    <ToolAccessGuard allowGuest reason="请先登录正式账号或游客账号后再使用三视图教学工具。">
      <main className="tool-runtime-shell">
        <div id="next_div" style={{ display: "none" }}></div>
        <div id="tool_title" style={{ display: "none" }}></div>
        <span id="operate_span" style={{ display: "none" }}></span>
        <input type="hidden" id="tid" value="" />
        <input type="hidden" id="type" value="" />
        <input type="hidden" id="userTokenId" value="" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.OPERATION_TAG_START = "";
              window.OPERATION_TAG_END = "";
              window.DASHED_LINE = "";
              window.SETINFO = "";
              window.submitQRCodeResult = function() {};
              window.openProgress = function() {};
              window.closeProgress = function() {};
            `,
          }}
        />

        <div className="tool-runtime-frame-wrap">
          <RandomToolFrame
            className="tool-runtime-frame"
            src={`/teacher-tools/tools/${currentTool.id}/legacy/${currentTool.entryFile}`}
            title={currentTool.title}
            currentViewMode={currentViewMode}
            currentCubeMode={currentCubeMode}
          />
        </div>
      </main>
    </ToolAccessGuard>
  );
}
