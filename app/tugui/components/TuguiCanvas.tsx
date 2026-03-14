"use client";

import { useEffect, useRef, useState } from 'react';
import { SolarTermData, GNOMON_HEIGHT, Season, SEASON_THEMES } from '../types';

interface TuguiCanvasProps {
  solarTermData: SolarTermData;
  season: Season;
}

interface CanvasSize {
  width: number;
  height: number;
  dpr: number;
}

// 季节性天空配色
const SKY_CONFIGS: Record<Season, { stops: [number, string][] }> = {
  spring: {
    stops: [
      [0, '#a8d8ea'],
      [0.3, '#c5e8d0'],
      [0.6, '#e8f5e9'],
      [0.85, '#fff9c4'],
      [1, '#f1f8e9'],
    ],
  },
  summer: {
    stops: [
      [0, '#1565c0'],
      [0.25, '#42a5f5'],
      [0.5, '#90caf9'],
      [0.75, '#fff59d'],
      [1, '#ffe0b2'],
    ],
  },
  autumn: {
    stops: [
      [0, '#e65100'],
      [0.2, '#ff8f00'],
      [0.45, '#ffb74d'],
      [0.7, '#ffe0b2'],
      [1, '#fff8e1'],
    ],
  },
  winter: {
    stops: [
      [0, '#455a64'],
      [0.3, '#78909c'],
      [0.6, '#b0bec5'],
      [0.85, '#cfd8dc'],
      [1, '#eceff1'],
    ],
  },
};

// 季节性地面配色
const GROUND_CONFIGS: Record<Season, { fill: string; line: string; hatch: string }> = {
  spring: { fill: '#8fbc8f', line: '#5a8a5a', hatch: '#6b9e6b' },
  summer: { fill: '#c9a87c', line: '#8b7355', hatch: '#b8976a' },
  autumn: { fill: '#c4a265', line: '#8b7355', hatch: '#b09050' },
  winter: { fill: '#d7ccc8', line: '#8d6e63', hatch: '#a1887f' },
};

// 季节性远山配色
const MOUNTAIN_CONFIGS: Record<Season, { layers: { color: string; opacity: number }[] }> = {
  spring: {
    layers: [
      { color: '#6b8e5a', opacity: 0.15 },
      { color: '#7da068', opacity: 0.22 },
      { color: '#8fbc8f', opacity: 0.3 },
    ],
  },
  summer: {
    layers: [
      { color: '#2e7d32', opacity: 0.12 },
      { color: '#388e3c', opacity: 0.2 },
      { color: '#4caf50', opacity: 0.28 },
    ],
  },
  autumn: {
    layers: [
      { color: '#bf6c2e', opacity: 0.12 },
      { color: '#c4813a', opacity: 0.2 },
      { color: '#d4a265', opacity: 0.28 },
    ],
  },
  winter: {
    layers: [
      { color: '#546e7a', opacity: 0.1 },
      { color: '#607d8b', opacity: 0.18 },
      { color: '#78909c', opacity: 0.25 },
    ],
  },
};

export default function TuguiCanvas({ solarTermData, season }: TuguiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const renderedDataRef = useRef<SolarTermData>(solarTermData);
  const animationStartTimeRef = useRef<number | null>(null);
  const lastDataUpdateTimeRef = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextWidth = rect.width;
      const nextHeight = rect.height;
      const nextDpr = window.devicePixelRatio || 1;

      setCanvasSize((prev) => {
        const sizeUnchanged =
          Math.abs(prev.width - nextWidth) < 0.5 &&
          Math.abs(prev.height - nextHeight) < 0.5 &&
          Math.abs(prev.dpr - nextDpr) < 0.01;

        if (sizeUnchanged) return prev;
        return { width: nextWidth, height: nextHeight, dpr: nextDpr };
      });
    };

    updateSize();

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSize) : null;
    resizeObserver?.observe(canvas);

    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width <= 0 || canvasSize.height <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = Math.max(1, Math.round(canvasSize.width * canvasSize.dpr));
    canvas.height = Math.max(1, Math.round(canvasSize.height * canvasSize.dpr));
    ctx.setTransform(canvasSize.dpr, 0, 0, canvasSize.dpr, 0, 0);

    const centerX = canvasSize.width / 2;
    const baseY = canvasSize.height * 0.82;
    const scale = clamp(Math.min(canvasSize.width / 28, canvasSize.height / 16), 14, 22);

    const now = performance.now();
    const previousUpdateTime = lastDataUpdateTimeRef.current;
    const isRapidUpdate = previousUpdateTime !== null && now - previousUpdateTime < 120;
    lastDataUpdateTimeRef.current = now;

    const animationDuration = isRapidUpdate ? 0 : 500;
    const previousData = renderedDataRef.current;
    const previousHourAngle = previousData.hourAngle ?? 0;
    const targetHourAngle = solarTermData.hourAngle ?? 0;

    const needsAnimation =
      previousData.solarAltitude !== solarTermData.solarAltitude ||
      previousData.shadowLength !== solarTermData.shadowLength ||
      Math.abs(previousHourAngle - targetHourAngle) > 0.01;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    animationStartTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (animationStartTimeRef.current === null) {
        animationStartTimeRef.current = timestamp;
      }

      const elapsed = timestamp - animationStartTimeRef.current;
      const progress = !needsAnimation || animationDuration === 0
        ? 1
        : Math.min(elapsed / animationDuration, 1);
      const easeProgress = animationDuration === 0
        ? 1
        : progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentFrameData: SolarTermData = {
        ...solarTermData,
        solarAltitude: previousData.solarAltitude +
          (solarTermData.solarAltitude - previousData.solarAltitude) * easeProgress,
        shadowLength: previousData.shadowLength +
          (solarTermData.shadowLength - previousData.shadowLength) * easeProgress,
        hourAngle: previousHourAngle + (targetHourAngle - previousHourAngle) * easeProgress,
      };
      renderedDataRef.current = currentFrameData;

      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

      const altitude = currentFrameData.solarAltitude;
      drawSkyGradient(ctx, canvasSize.width, canvasSize.height, season, altitude);
      drawDirectionLabels(ctx, canvasSize.width, season);
      drawMountains(ctx, canvasSize.width, baseY, season, altitude);

      // 太阳在地平线以上才绘制太阳、影子、角度标注
      if (altitude > 0) {
        drawSun(ctx, currentFrameData, centerX, baseY, canvasSize.width, season);
      }

      drawGround(ctx, canvasSize.width, canvasSize.height, baseY, season, altitude);

      if (altitude > 0) {
        drawShadow(ctx, currentFrameData, centerX, baseY, scale, canvasSize.width);
      }

      drawGnomon(ctx, centerX, baseY, scale, canvasSize.width, season);

      if (altitude > 0) {
        drawAngleLabel(ctx, currentFrameData, centerX, baseY, canvasSize.width);
        drawShadowLabel(ctx, currentFrameData, centerX, baseY, scale, canvasSize.width, season);
      }

      // 太阳落到地平线以下后，整体场景继续变暗
      drawSceneNightShade(ctx, canvasSize.width, canvasSize.height, altitude);

      // 夜晚提示
      if (altitude <= 0) {
        drawNightOverlay(ctx, canvasSize.width, canvasSize.height, altitude);
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        renderedDataRef.current = currentFrameData;
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [solarTermData, canvasSize, season]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`土圭测影示意图，观测日期为${solarTermData.date}`}
      className="w-full h-full transition-all duration-500"
      style={{ width: '100%', height: '100%' }}
    >
      当前浏览器不支持 Canvas 动画展示。
    </canvas>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getSunHorizontalRatio(data: SolarTermData) {
  const hourAngle = data.hourAngle ?? 0;
  // 东升西落：上午（负时角）在右侧，下午（正时角）在左侧
  return clamp(-hourAngle / 90, -1, 1);
}

function getAngleLabelDirection(data: SolarTermData): -1 | 1 {
  const horizontalRatio = getSunHorizontalRatio(data);
  if (Math.abs(horizontalRatio) < 0.02) return 1;
  return horizontalRatio >= 0 ? 1 : -1;
}

function getShadowDirection(data: SolarTermData): -1 | 1 {
  // 影子方向 = 太阳的反方向
  return (getAngleLabelDirection(data) > 0 ? -1 : 1) as -1 | 1;
}

function getVisibleShadowLength(
  data: SolarTermData,
  centerX: number,
  scale: number,
  canvasWidth: number,
) {
  const rawShadowLength = data.shadowLength * GNOMON_HEIGHT * scale;
  const direction = getShadowDirection(data);
  const maxVisibleShadowLength = direction < 0
    ? Math.max(0, centerX - 12)
    : Math.max(0, canvasWidth - centerX - 12);
  return Math.min(rawShadowLength, maxVisibleShadowLength);
}

function getSunDistance(data: SolarTermData, centerX: number, baseY: number, canvasWidth: number) {
  const isMobile = canvasWidth < 640;
  const sunHaloRadius = isMobile ? 30 : 38;
  const direction = getAngleLabelDirection(data);
  const altitudeRad = data.solarAltitude * (Math.PI / 180);
  const cosAltitude = Math.cos(altitudeRad);
  const sinAltitude = Math.sin(altitudeRad);

  const horizontalAvailable = direction > 0
    ? canvasWidth - centerX - sunHaloRadius - 12
    : centerX - sunHaloRadius - 12;
  const verticalAvailable = baseY - sunHaloRadius - 12;

  const maxByX = cosAltitude > 0.001
    ? horizontalAvailable / cosAltitude
    : Number.POSITIVE_INFINITY;
  const maxByY = sinAltitude > 0.001
    ? verticalAvailable / sinAltitude
    : Number.POSITIVE_INFINITY;
  const hardMaxDistance = Math.max(0, Math.min(maxByX, maxByY));

  const preferredDistance = (isMobile ? 0.82 : 0.9) * Math.min(canvasWidth, baseY);
  return Math.max(0, Math.min(preferredDistance, hardMaxDistance));
}

// 计算天空暗度系数：高度角越低天越暗，负角度为夜晚
function getSkyDarkness(altitude: number): number {
  if (altitude >= 20) return 0;       // 白天，不变暗
  if (altitude <= -18) return 1;      // 深夜，全暗
  // -18 ~ 20 之间线性过渡
  return 1 - (altitude + 18) / 38;
}

function drawSceneNightShade(ctx: CanvasRenderingContext2D, width: number, height: number, altitude: number) {
  if (altitude >= 0) return;

  const depth = clamp(-altitude / 18, 0, 1);
  const shadeAlpha = 0.2 + depth * 0.25;

  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${shadeAlpha})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// 混合颜色（hex）和黑色
function darkenColor(hex: string, darkness: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const factor = 1 - darkness * 0.85; // 最暗保留15%亮度
  const nr = Math.round(r * factor);
  const ng = Math.round(g * factor);
  const nb = Math.round(b * factor);
  return `rgb(${nr},${ng},${nb})`;
}

// 绘制季节性天空渐变（根据太阳高度角调整明暗）
function drawSkyGradient(ctx: CanvasRenderingContext2D, width: number, height: number, season: Season, altitude: number) {
  const config = SKY_CONFIGS[season];
  const darkness = getSkyDarkness(altitude);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  for (const [stop, color] of config.stops) {
    gradient.addColorStop(stop, darkenColor(color, darkness));
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 夜晚绘制星星
  if (darkness > 0.5) {
    const starAlpha = (darkness - 0.5) * 2; // 0~1
    drawStars(ctx, width, height, starAlpha);
  }
}

function drawDirectionLabels(ctx: CanvasRenderingContext2D, width: number, season: Season) {
  const theme = SEASON_THEMES[season];
  const isMobile = width < 640;
  const edgePadding = isMobile ? 16 : 22;
  const top = isMobile ? 20 : 26;
  const labelWidth = isMobile ? 28 : 34;
  const labelHeight = isMobile ? 24 : 28;

  const drawLabel = (x: number, text: '东' | '西') => {
    ctx.fillStyle = 'rgba(255, 253, 248, 0.78)';
    ctx.fillRect(x - labelWidth / 2, top - labelHeight / 2, labelWidth, labelHeight);
    ctx.strokeStyle = 'rgba(92, 61, 30, 0.42)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - labelWidth / 2, top - labelHeight / 2, labelWidth, labelHeight);

    ctx.fillStyle = theme.accent;
    ctx.font = isMobile ? 'bold 15px "Noto Serif SC", serif' : 'bold 18px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, top);
  };

  drawLabel(edgePadding, '西');
  drawLabel(width - edgePadding, '东');
}

// 绘制星星
function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  // 用固定种子生成伪随机星星位置
  const stars = [
    [0.1, 0.08], [0.25, 0.15], [0.4, 0.05], [0.55, 0.12], [0.7, 0.03],
    [0.85, 0.18], [0.15, 0.25], [0.35, 0.22], [0.6, 0.28], [0.8, 0.1],
    [0.05, 0.35], [0.45, 0.32], [0.75, 0.38], [0.9, 0.3], [0.3, 0.4],
    [0.65, 0.2], [0.2, 0.42], [0.5, 0.18], [0.95, 0.25], [0.12, 0.15],
  ];
  for (const [sx, sy] of stars) {
    const x = sx * width;
    const y = sy * height;
    const r = 0.8 + (sx * 17 % 1) * 1.2;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 夜晚提示文字
function drawNightOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, altitude: number) {
  const isMobile = width < 640;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = isMobile ? '14px "Noto Serif SC", serif' : '18px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`太阳在地平线以下 (${altitude.toFixed(1)}°)，无日影`, width / 2, height * 0.5);
  ctx.restore();
}

// 绘制水墨远山
function drawMountains(ctx: CanvasRenderingContext2D, width: number, baseY: number, season: Season, altitude: number) {
  const config = MOUNTAIN_CONFIGS[season];
  const layers = config.layers;
  const darkness = getSkyDarkness(altitude);

  // 三层远山，从远到近
  const mountainDefs = [
    { yOffset: baseY * 0.25, amplitude: baseY * 0.18, frequency: 0.003, layerIdx: 0 },
    { yOffset: baseY * 0.15, amplitude: baseY * 0.22, frequency: 0.005, layerIdx: 1 },
    { yOffset: baseY * 0.05, amplitude: baseY * 0.15, frequency: 0.008, layerIdx: 2 },
  ];

  for (const def of mountainDefs) {
    const layer = layers[def.layerIdx];
    ctx.save();
    ctx.globalAlpha = layer.opacity * (1 - darkness * 0.6);
    ctx.fillStyle = darkenColor(layer.color, darkness);
    ctx.beginPath();
    ctx.moveTo(0, baseY);

    for (let x = 0; x <= width; x += 2) {
      const y = baseY - def.yOffset -
        Math.sin(x * def.frequency + def.layerIdx * 1.5) * def.amplitude * 0.6 -
        Math.sin(x * def.frequency * 2.3 + def.layerIdx * 0.8) * def.amplitude * 0.3 -
        Math.sin(x * def.frequency * 0.5 + def.layerIdx * 3) * def.amplitude * 0.1;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// 绘制季节性地面
function drawGround(ctx: CanvasRenderingContext2D, width: number, height: number, baseY: number, season: Season, altitude: number) {
  const config = GROUND_CONFIGS[season];
  const darkness = getSkyDarkness(altitude);

  ctx.fillStyle = darkenColor(config.fill, darkness);
  ctx.fillRect(0, baseY, width, height - baseY);

  ctx.strokeStyle = darkenColor(config.line, darkness);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  ctx.lineTo(width, baseY);
  ctx.stroke();

  // 斜线纹理
  ctx.strokeStyle = darkenColor(config.hatch, darkness);
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.3;
  const lineSpacing = 8;
  const lineLength = 25;

  for (let x = -lineLength; x < width + lineLength; x += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + lineLength, baseY + lineLength);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// 绘制土圭立杆（古典木色）
function drawGnomon(ctx: CanvasRenderingContext2D, centerX: number, baseY: number, scale: number, canvasWidth: number, season: Season) {
  const theme = SEASON_THEMES[season];
  const gnomonHeight = GNOMON_HEIGHT * scale;
  const gnomonWidth = canvasWidth < 640 ? 10 : 12;
  const isMobile = canvasWidth < 640;

  // 木杆 - 深棕色渐变
  const woodGrad = ctx.createLinearGradient(
    centerX - gnomonWidth / 2, 0,
    centerX + gnomonWidth / 2, 0
  );
  woodGrad.addColorStop(0, '#6d4c2a');
  woodGrad.addColorStop(0.3, '#8b6914');
  woodGrad.addColorStop(0.7, '#8b6914');
  woodGrad.addColorStop(1, '#5c3d1e');

  ctx.fillStyle = woodGrad;
  ctx.fillRect(centerX - gnomonWidth / 2, baseY - gnomonHeight, gnomonWidth, gnomonHeight);

  ctx.strokeStyle = '#4a3520';
  ctx.lineWidth = 1;
  ctx.strokeRect(centerX - gnomonWidth / 2, baseY - gnomonHeight, gnomonWidth, gnomonHeight);

  // 杆顶装饰 - 小圆球
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(centerX, baseY - gnomonHeight - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8b6914';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 测日杆标签 - 古典风格
  const gnomonLabelY = baseY - gnomonHeight - (isMobile ? 22 : 32);
  const labelWidth = isMobile ? 56 : 66;
  const labelHeight = isMobile ? 20 : 24;

  ctx.fillStyle = 'rgba(255, 253, 248, 0.92)';
  ctx.fillRect(centerX - labelWidth / 2, gnomonLabelY - labelHeight / 2, labelWidth, labelHeight);
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(centerX - labelWidth / 2, gnomonLabelY - labelHeight / 2, labelWidth, labelHeight);

  ctx.fillStyle = theme.accent;
  ctx.font = isMobile ? 'bold 11px "Noto Serif SC", serif' : 'bold 13px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('测日杆', centerX, gnomonLabelY);

  // 杆高标注
  const heightLabelX = centerX - (isMobile ? 35 : 45);
  const heightLabelY = baseY - gnomonHeight / 2;

  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(heightLabelX, baseY);
  ctx.lineTo(heightLabelX, baseY - gnomonHeight);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(heightLabelX - 5, baseY);
  ctx.lineTo(heightLabelX + 5, baseY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(heightLabelX - 5, baseY - gnomonHeight);
  ctx.lineTo(heightLabelX + 5, baseY - gnomonHeight);
  ctx.stroke();

  const heightLabelWidth = isMobile ? 44 : 52;
  const heightLabelHeight = isMobile ? 22 : 26;

  ctx.fillStyle = 'rgba(255, 253, 248, 0.92)';
  ctx.fillRect(heightLabelX - heightLabelWidth / 2, heightLabelY - heightLabelHeight / 2, heightLabelWidth, heightLabelHeight);
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(heightLabelX - heightLabelWidth / 2, heightLabelY - heightLabelHeight / 2, heightLabelWidth, heightLabelHeight);

  ctx.fillStyle = theme.accent;
  ctx.font = isMobile ? 'bold 10px "Noto Serif SC", serif' : 'bold 12px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('杆高', heightLabelX, heightLabelY);
}

// 绘制影子
function drawShadow(
  ctx: CanvasRenderingContext2D,
  data: SolarTermData,
  centerX: number,
  baseY: number,
  scale: number,
  canvasWidth: number,
) {
  const direction = getShadowDirection(data);
  const shadowLength = getVisibleShadowLength(data, centerX, scale, canvasWidth);

  if (shadowLength <= 0.1) return;

  const shadowEndX = centerX + direction * shadowLength;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.moveTo(centerX, baseY);
  ctx.lineTo(shadowEndX, baseY);
  ctx.lineTo(centerX, baseY - 10);
  ctx.closePath();
  ctx.fill();
}

// 绘制影长标注
function drawShadowLabel(ctx: CanvasRenderingContext2D, data: SolarTermData, centerX: number, baseY: number, scale: number, canvasWidth: number, season: Season) {
  const theme = SEASON_THEMES[season];
  const direction = getShadowDirection(data);
  const shadowLength = getVisibleShadowLength(data, centerX, scale, canvasWidth);
  const isMobile = canvasWidth < 640;

  if (shadowLength <= 0.1) return;

  const shadowEndX = centerX + direction * shadowLength;
  const indicatorStartX = Math.min(centerX, shadowEndX);
  const indicatorEndX = Math.max(centerX, shadowEndX);

  const indicatorY = baseY + (isMobile ? 12 : 15);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(indicatorStartX, indicatorY);
  ctx.lineTo(indicatorEndX, indicatorY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(indicatorStartX, indicatorY - 4);
  ctx.lineTo(indicatorStartX, indicatorY + 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(indicatorEndX, indicatorY - 4);
  ctx.lineTo(indicatorEndX, indicatorY + 4);
  ctx.stroke();

  const labelWidth = isMobile ? 42 : 50;
  const labelHeight = isMobile ? 20 : 24;
  const labelX = clamp(
    centerX + (direction * shadowLength) / 2,
    labelWidth / 2 + 8,
    canvasWidth - labelWidth / 2 - 8
  );
  const labelY = indicatorY + (isMobile ? 16 : 20);

  ctx.fillStyle = 'rgba(255, 253, 248, 0.92)';
  ctx.fillRect(labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight);
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight);

  ctx.fillStyle = theme.accent;
  ctx.font = isMobile ? 'bold 10px "Noto Serif SC", serif' : 'bold 12px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('影长', labelX, labelY);
}

// 绘制太阳
function drawSun(ctx: CanvasRenderingContext2D, data: SolarTermData, centerX: number, baseY: number, canvasWidth: number, season: Season) {
  const altitudeRad = data.solarAltitude * (Math.PI / 180);
  const isMobile = canvasWidth < 640;

  const sunRadius = isMobile ? 24 : 30;
  const sunHaloRadius = isMobile ? 30 : 38;

  // 太阳方向与角度标注完全一致
  const direction = getAngleLabelDirection(data);
  const cosAltitude = Math.cos(altitudeRad);
  const sinAltitude = Math.sin(altitudeRad);

  const sunDistance = getSunDistance(data, centerX, baseY, canvasWidth);

  // 太阳严格沿高度角方向放置
  const sunX = centerX + direction * sunDistance * cosAltitude;
  const sunY = baseY - sunDistance * sinAltitude;

  // 太阳颜色
  const sunColors: Record<Season, [string, string, string]> = {
    spring: ['#FFF9C4', '#FFD54F', '#FFA726'],
    summer: ['#FFFFFF', '#FFE082', '#FF8F00'],
    autumn: ['#FFF8E1', '#FFCC80', '#E65100'],
    winter: ['#ECEFF1', '#FFE0B2', '#FFB74D'],
  };

  const [c1, c2, c3] = sunColors[season];
  const gradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
  gradient.addColorStop(0, c1);
  gradient.addColorStop(0.6, c2);
  gradient.addColorStop(1, c3);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  // 光晕
  ctx.strokeStyle = 'rgba(255, 193, 7, 0.25)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunHaloRadius, 0, Math.PI * 2);
  ctx.stroke();
}

// 绘制角度标注
function drawAngleLabel(ctx: CanvasRenderingContext2D, data: SolarTermData, centerX: number, baseY: number, canvasWidth: number) {
  const angle = data.solarAltitude * (Math.PI / 180);
  const isMobile = canvasWidth < 640;
  const arcRadius = isMobile ? 50 : 70;
  const direction = getAngleLabelDirection(data);
  const startArcAngle = direction > 0 ? 0 : Math.PI;
  const endArcAngle = direction > 0 ? -angle : Math.PI + angle;
  const isCounterClockwise = direction > 0;

  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = isMobile ? 1.5 : 2;
  ctx.beginPath();
  ctx.arc(centerX, baseY, arcRadius, startArcAngle, endArcAngle, isCounterClockwise);
  ctx.stroke();

  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX + direction * arcRadius, baseY - 4);
  ctx.lineTo(centerX + direction * arcRadius, baseY + 4);
  ctx.stroke();

  const endX = centerX + direction * Math.cos(angle) * arcRadius;
  const endY = baseY - Math.sin(angle) * arcRadius;

  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(centerX, baseY);
  
  const sunDistance = getSunDistance(data, centerX, baseY, canvasWidth);
  const sunHaloRadius = isMobile ? 30 : 38;
  const lineDistance = Math.max(arcRadius, sunDistance - sunHaloRadius - 5);
  const lineEndX = centerX + direction * Math.cos(angle) * lineDistance;
  const lineEndY = baseY - Math.sin(angle) * lineDistance;
  
  ctx.lineTo(lineEndX, lineEndY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(endX, endY, isMobile ? 3 : 4, 0, Math.PI * 2);
  ctx.fillStyle = '#c0392b';
  ctx.fill();

  const labelDistance = arcRadius + (isMobile ? 25 : 35);
  const labelX = centerX + direction * Math.cos(angle / 2) * labelDistance;
  const labelY = baseY - Math.sin(angle / 2) * labelDistance;
  const labelWidth = isMobile ? 52 : 64;
  const labelHeight = isMobile ? 24 : 28;

  ctx.fillStyle = 'rgba(255, 253, 248, 0.92)';
  ctx.fillRect(labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight);
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1;
  ctx.strokeRect(labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight);

  ctx.fillStyle = '#c0392b';
  ctx.font = isMobile ? 'bold 11px "Noto Serif SC", serif' : 'bold 13px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${data.solarAltitude.toFixed(1)}°`, labelX, labelY);

  // 地平线参考线
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(centerX, baseY);
  ctx.lineTo(centerX + direction * (arcRadius + (isMobile ? 30 : 50)), baseY);
  ctx.stroke();
  ctx.setLineDash([]);
}
