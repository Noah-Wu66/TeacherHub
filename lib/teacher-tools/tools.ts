export type ViewMode = "1" | "2" | "3";
export type CubeMode = "base" | "4" | "5";

export type ToolMeta = {
  id: string;
  title: string;
  description: string;
  route: string;
  sourceDir: string;
  entryFile: string;
  buttonLabel: string;
  viewMode: ViewMode;
  cubeMode: CubeMode;
};

export const VIEW_MODE_OPTIONS: ReadonlyArray<{
  value: ViewMode;
  label: string;
}> = [
  { value: "1", label: "一个视图" },
  { value: "2", label: "两个视图" },
  { value: "3", label: "三个视图" },
];

export const CUBE_MODE_OPTIONS: ReadonlyArray<{
  value: CubeMode;
  label: string;
}> = [
  { value: "base", label: "基础" },
  { value: "4", label: "4块" },
  { value: "5", label: "5块" },
];

export const TOOLS: ToolMeta[] = [
  {
    id: "010289001",
    title: "根据一个视图摆放小正方体",
    description: "单视图 + 基础题组。",
    route: "/teacher-tools/tools/010289001",
    sourceDir: "legacy_tools/010289001",
    entryFile: "loadtool_010289001.html",
    buttonLabel: "一个视图 基础",
    viewMode: "1",
    cubeMode: "base",
  },
  {
    id: "010289002",
    title: "根据一个视图摆放小正方体（4块）",
    description: "单视图 + 4块小正方体。",
    route: "/teacher-tools/tools/010289002",
    sourceDir: "legacy_tools/010289002",
    entryFile: "loadtool_010289002.html",
    buttonLabel: "一个视图 4块",
    viewMode: "1",
    cubeMode: "4",
  },
  {
    id: "010289003",
    title: "根据一个视图摆放小正方体（5块）",
    description: "单视图 + 5块小正方体。",
    route: "/teacher-tools/tools/010289003",
    sourceDir: "legacy_tools/010289003",
    entryFile: "loadtool_010289003.html",
    buttonLabel: "一个视图 5块",
    viewMode: "1",
    cubeMode: "5",
  },
  {
    id: "010288001",
    title: "根据两个视图摆放小正方体",
    description: "双视图 + 基础题组。",
    route: "/teacher-tools/tools/010288001",
    sourceDir: "legacy_tools/010288001",
    entryFile: "loadtool_010288001.html",
    buttonLabel: "两个视图 基础",
    viewMode: "2",
    cubeMode: "base",
  },
  {
    id: "010288002",
    title: "根据两个视图摆放小正方体（4块）",
    description: "双视图 + 4块小正方体。",
    route: "/teacher-tools/tools/010288002",
    sourceDir: "legacy_tools/010288002",
    entryFile: "loadtool_010288002.html",
    buttonLabel: "两个视图 4块",
    viewMode: "2",
    cubeMode: "4",
  },
  {
    id: "010288003",
    title: "根据两个视图摆放小正方体（5块）",
    description: "双视图 + 5块小正方体。",
    route: "/teacher-tools/tools/010288003",
    sourceDir: "legacy_tools/010288003",
    entryFile: "loadtool_010288003.html",
    buttonLabel: "两个视图 5块",
    viewMode: "2",
    cubeMode: "5",
  },
  {
    id: "010222001",
    title: "根据三视图摆放小正方体",
    description: "三视图 + 基础题组。",
    route: "/teacher-tools/tools/010222001",
    sourceDir: "legacy_tools/010222001",
    entryFile: "loadtool_010222001.html",
    buttonLabel: "三视图 基础",
    viewMode: "3",
    cubeMode: "base",
  },
  {
    id: "010222002",
    title: "根据三视图摆放小正方体（4块）",
    description: "三视图 + 4块小正方体。",
    route: "/teacher-tools/tools/010222002",
    sourceDir: "legacy_tools/010222002",
    entryFile: "loadtool_010222002.html",
    buttonLabel: "三视图 4块",
    viewMode: "3",
    cubeMode: "4",
  },
  {
    id: "010222003",
    title: "根据三视图摆放小正方体（5块）",
    description: "三视图 + 5块小正方体。",
    route: "/teacher-tools/tools/010222003",
    sourceDir: "legacy_tools/010222003",
    entryFile: "loadtool_010222003.html",
    buttonLabel: "三视图 5块",
    viewMode: "3",
    cubeMode: "5",
  },
];

export const DEFAULT_VIEW_MODE: ViewMode = "3";
export const DEFAULT_CUBE_MODE: CubeMode = "4";

export function getToolById(id: string): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.id === id);
}

export function getToolByConfig(
  viewMode: ViewMode,
  cubeMode: CubeMode
): ToolMeta | undefined {
  return TOOLS.find(
    (tool) => tool.viewMode === viewMode && tool.cubeMode === cubeMode
  );
}

export function parseViewMode(raw?: string | null): ViewMode | undefined {
  if (raw === "1" || raw === "2" || raw === "3") {
    return raw;
  }
  return undefined;
}

export function parseCubeMode(raw?: string | null): CubeMode | undefined {
  if (raw === "base" || raw === "4" || raw === "5") {
    return raw;
  }
  return undefined;
}

export const DEFAULT_TOOL_ID =
  getToolByConfig(DEFAULT_VIEW_MODE, DEFAULT_CUBE_MODE)?.id ?? "010222002";
