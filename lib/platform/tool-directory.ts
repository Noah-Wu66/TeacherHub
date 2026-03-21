export type ToolDirectoryItem = {
  name: string;
  path: string;
  description: string;
};

export type ToolDirectoryGroup = {
  title: string;
  items: ToolDirectoryItem[];
};

export const TOOL_DIRECTORY_GROUPS: ToolDirectoryGroup[] = [
  {
    title: "应用集合",
    items: [
      {
        name: "教学工具集首页",
        path: "/",
        description: "全部工具总入口。",
      },
      {
        name: "智趣学",
        path: "/ai-education",
        description: "AI 学习平台主页面。",
      },
      {
        name: "24点挑战",
        path: "/24-point",
        description: "24点模式选择页。",
      },
      {
        name: "数独挑战",
        path: "/sudoku",
        description: "数独游戏系统。",
      },
      {
        name: "三视图教学工具",
        path: "/teacher-tools",
        description: "三视图教学演示与练习工具。",
      },
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
        description: "语音互动及查询工具。",
      },
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
