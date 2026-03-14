"use client";

import { useCallback, useRef } from "react";
import type { CubeMode, ViewMode } from "@/lib/teacher-tools/tools";

type RandomToolFrameProps = {
  src: string;
  title: string;
  className: string;
  currentViewMode: ViewMode;
  currentCubeMode: CubeMode;
};

const VIEW_OPTIONS: ReadonlyArray<{ value: ViewMode; label: string }> = [
  { value: "1", label: "一个视图" },
  { value: "2", label: "两个视图" },
  { value: "3", label: "三个视图" },
];

const CUBE_OPTIONS: ReadonlyArray<{ value: CubeMode; label: string }> = [
  { value: "base", label: "基础" },
  { value: "4", label: "4块" },
  { value: "5", label: "5块" },
];

function jumpToTools(url: string) {
  if (window.top) {
    window.top.location.assign(url);
    return;
  }
  window.location.assign(url);
}

function buildToolsHref(viewMode: ViewMode, cubeMode: CubeMode): string {
  const query = new URLSearchParams({ view: viewMode, cube: cubeMode });
  return `/teacher-tools/tools?${query.toString()}`;
}

function createSwitchButton(
  frameDoc: Document,
  label: string,
  isActive: boolean,
  onClick: () => void
) {
  const button = frameDoc.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.style.height = "32px";
  button.style.padding = "0 12px";
  button.style.borderRadius = "999px";
  button.style.border = isActive ? "1px solid #1d4ed8" : "1px solid #c7d2e0";
  button.style.background = isActive ? "#1d4ed8" : "#ffffff";
  button.style.color = isActive ? "#ffffff" : "#1f2a37";
  button.style.fontSize = "13px";
  button.style.fontWeight = "600";
  button.style.cursor = isActive ? "default" : "pointer";
  button.style.pointerEvents = isActive ? "none" : "auto";

  if (!isActive) {
    button.addEventListener("click", onClick);
  }

  return button;
}

function createConfigRow(frameDoc: Document, label: string) {
  const row = frameDoc.createElement("div");
  row.style.display = "grid";
  row.style.gap = "8px";

  const title = frameDoc.createElement("div");
  title.textContent = label;
  title.style.fontSize = "12px";
  title.style.color = "#52606d";
  title.style.fontWeight = "600";

  const list = frameDoc.createElement("div");
  list.style.display = "flex";
  list.style.flexWrap = "wrap";
  list.style.gap = "8px";

  row.appendChild(title);
  row.appendChild(list);
  return { row, list };
}

function getRandomButton(frameDoc: Document): HTMLButtonElement | null {
  const qdiv = frameDoc.getElementById("qdiv");
  const buttonNodes = qdiv?.querySelectorAll("button") ?? frameDoc.querySelectorAll("button");
  const buttons = Array.from(buttonNodes).filter(
    (node): node is HTMLButtonElement => node instanceof HTMLButtonElement
  );

  const byText = buttons.find((button) =>
    (button.textContent ?? "").replace(/\s+/g, "").includes("随机")
  );

  if (byText) {
    return byText;
  }

  const byGraphType6 = buttons.find((button) => button.id === "graphType6");
  if (byGraphType6) {
    return byGraphType6;
  }

  return null;
}

function mountConfigPanel(
  frameDoc: Document,
  currentViewMode: ViewMode,
  currentCubeMode: CubeMode
) {
  const leftDiv = frameDoc.getElementById("leftdiv");
  if (!leftDiv) {
    return;
  }

  const oldPanel = frameDoc.getElementById("next-config-panel");
  if (oldPanel) {
    oldPanel.remove();
  }

  const panel = frameDoc.createElement("div");
  panel.id = "next-config-panel";
  panel.style.margin = "10px 12px 8px";
  panel.style.padding = "12px";
  panel.style.borderRadius = "10px";
  panel.style.background = "#f8fafc";
  panel.style.border = "1px solid #d7dee8";
  panel.style.display = "grid";
  panel.style.gap = "10px";

  const panelTitle = frameDoc.createElement("div");
  panelTitle.textContent = "工具设置中心";
  panelTitle.style.fontSize = "14px";
  panelTitle.style.fontWeight = "700";
  panelTitle.style.color = "#1f2a37";

  const { row: viewRow, list: viewList } = createConfigRow(frameDoc, "选择视图");
  for (const option of VIEW_OPTIONS) {
    const button = createSwitchButton(
      frameDoc,
      option.label,
      option.value === currentViewMode,
      () => {
        jumpToTools(buildToolsHref(option.value, currentCubeMode));
      }
    );
    viewList.appendChild(button);
  }

  const { row: cubeRow, list: cubeList } = createConfigRow(frameDoc, "选择方块");
  for (const option of CUBE_OPTIONS) {
    const button = createSwitchButton(
      frameDoc,
      option.label,
      option.value === currentCubeMode,
      () => {
        jumpToTools(buildToolsHref(currentViewMode, option.value));
      }
    );
    cubeList.appendChild(button);
  }

  panel.appendChild(panelTitle);
  panel.appendChild(viewRow);
  panel.appendChild(cubeRow);

  leftDiv.insertBefore(panel, leftDiv.firstChild);
}

function mountNextRandomButton(frameDoc: Document, onNext: () => void) {
  const qdiv = frameDoc.getElementById("qdiv");
  if (!qdiv) {
    return;
  }

  const buttons = Array.from(qdiv.querySelectorAll("button")).filter(
    (node): node is HTMLButtonElement => node instanceof HTMLButtonElement
  );
  for (const button of buttons) {
    button.style.display = "none";
  }

  const oldButton = frameDoc.getElementById("next-random-question-btn");
  if (oldButton) {
    oldButton.remove();
  }

  const nextButton = frameDoc.createElement("button");
  nextButton.id = "next-random-question-btn";
  nextButton.type = "button";
  nextButton.className = "action_top_button_selected";
  nextButton.textContent = "下一题（随机）";
  nextButton.style.width = "calc(100% - 24px)";
  nextButton.style.margin = "4px 12px 0";
  nextButton.style.display = "block";
  nextButton.addEventListener("click", onNext);

  qdiv.appendChild(nextButton);
}

function runRandom(randomButton: HTMLButtonElement) {
  const randomHops = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < randomHops; i += 1) {
    randomButton.click();
  }
}

export default function RandomToolFrame({
  src,
  title,
  className,
  currentViewMode,
  currentCubeMode,
}: RandomToolFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleLoad = useCallback(() => {
    const frame = iframeRef.current;
    const frameDoc = frame?.contentDocument;

    if (!frame || !frameDoc) {
      return;
    }

    mountConfigPanel(frameDoc, currentViewMode, currentCubeMode);

    const randomButton = getRandomButton(frameDoc);
    if (!randomButton) {
      return;
    }

    const onNext = () => runRandom(randomButton);
    mountNextRandomButton(frameDoc, onNext);

    window.setTimeout(onNext, 80);
  }, [currentCubeMode, currentViewMode]);

  return (
    <iframe
      key={src}
      ref={iframeRef}
      className={className}
      src={src}
      title={title}
      allow="fullscreen"
      onLoad={handleLoad}
    />
  );
}
