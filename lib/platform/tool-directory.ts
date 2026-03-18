import { TOOLS } from "@/lib/teacher-tools/tools";

export type ToolDirectoryItem = {
  name: string;
  path: string;
  description: string;
};

export type ToolDirectoryGroup = {
  title: string;
  items: ToolDirectoryItem[];
};

const teacherToolItems: ToolDirectoryItem[] = TOOLS.map((tool) => ({
  name: tool.title,
  path: tool.route,
  description: tool.description,
}));

export const TOOL_DIRECTORY_GROUPS: ToolDirectoryGroup[] = [
  {
    title: "总入口",
    items: [
      {
        name: "教学工具集首页",
        path: "/",
        description: "全部工具总入口。",
      },
    ],
  },
  {
    title: "智趣学",
    items: [
      {
        name: "智趣学首页",
        path: "/ai-education",
        description: "AI 学习平台主页面。",
      },
      {
        name: "语音通话",
        path: "/ai-education/voice",
        description: "语音问答页面。",
      },
      {
        name: "大思政课入口",
        path: "/ai-education/dasi-zhengke",
        description: "会根据身份跳到教师页或学生页。",
      },
      {
        name: "大思政课教师页",
        path: "/ai-education/dasi-zhengke/teacher",
        description: "教师端专题页面。",
      },
      {
        name: "大思政课学生页",
        path: "/ai-education/dasi-zhengke/student",
        description: "学生端专题页面。",
      },
    ],
  },
  {
    title: "24点挑战",
    items: [
      {
        name: "24点首页",
        path: "/24-point",
        description: "24点模式选择页。",
      },
      {
        name: "单人练习",
        path: "/24-point/solo",
        description: "24点单人练习。",
      },
      {
        name: "人机对战",
        path: "/24-point/vs-ai",
        description: "24点人机对战。",
      },
      {
        name: "多人联机",
        path: "/24-point/multiplayer",
        description: "24点联机大厅。",
      },
    ],
  },
  {
    title: "数独挑战",
    items: [
      {
        name: "数独首页",
        path: "/sudoku",
        description: "数独模式选择页。",
      },
      {
        name: "单人闯关",
        path: "/sudoku/solo",
        description: "数独单人闯关。",
      },
      {
        name: "教学陪练",
        path: "/sudoku/coach",
        description: "数独教学陪练。",
      },
      {
        name: "双人竞速",
        path: "/sudoku/multiplayer",
        description: "数独联机大厅。",
      },
    ],
  },
  {
    title: "其它单页工具",
    items: [
      {
        name: "数你最棒",
        path: "/math",
        description: "小学数学练习平台。",
      },
      {
        name: "土圭之法",
        path: "/tugui",
        description: "古代天文观测模拟器。",
      },
      {
        name: "植树问题",
        path: "/planting",
        description: "植树问题 AI 学习平台。",
      },
      {
        name: "你问我答",
        path: "/voice-qa",
        description: "李雪老师语音互动工具。",
      },
    ],
  },
  {
    title: "三视图教学工具",
    items: [
      {
        name: "三视图首页",
        path: "/teacher-tools",
        description: "三视图工具总入口。",
      },
      {
        name: "工具设置页",
        path: "/teacher-tools/tools",
        description: "三视图工具默认入口。",
      },
      ...teacherToolItems,
    ],
  },
];

export function buildToolDirectory(origin: string) {
  return TOOL_DIRECTORY_GROUPS.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      ...item,
      url: `${origin}${item.path}`,
    })),
  }));
}
