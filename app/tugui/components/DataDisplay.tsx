'use client';

import { useEffect, useState, useRef } from 'react';
import { SolarTermData, GNOMON_HEIGHT, Season, SEASON_THEMES } from '../types';

interface DataDisplayProps {
  data: SolarTermData;
  season: Season;
}

export default function DataDisplay({ data, season }: DataDisplayProps) {
  const [displayAltitude, setDisplayAltitude] = useState(data.solarAltitude);
  const [displayShadowLength, setDisplayShadowLength] = useState(data.shadowLength);
  const animationFrameRef = useRef<number | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);
  const lastDataUpdateTimeRef = useRef<number | null>(null);
  const theme = SEASON_THEMES[season];

  useEffect(() => {
    const now = performance.now();
    const previousUpdateTime = lastDataUpdateTimeRef.current;
    const isRapidUpdate = previousUpdateTime !== null && now - previousUpdateTime < 120;
    lastDataUpdateTimeRef.current = now;

    const startAltitude = displayAltitude;
    const startShadowLength = displayShadowLength;
    const targetAltitude = data.solarAltitude;
    const targetShadowLength = data.shadowLength;

    const needsAnimation =
      Math.abs(targetAltitude - displayAltitude) > 0.01 ||
      Math.abs(targetShadowLength - displayShadowLength) > 0.01;

    if (!needsAnimation) return;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (isRapidUpdate) {
      setDisplayAltitude(targetAltitude);
      setDisplayShadowLength(targetShadowLength);
      return;
    }

    animationStartTimeRef.current = null;
    const duration = 500;

    const animate = (timestamp: number) => {
      if (animationStartTimeRef.current === null) {
        animationStartTimeRef.current = timestamp;
      }

      const elapsed = timestamp - animationStartTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      setDisplayAltitude(startAltitude + (targetAltitude - startAltitude) * easeProgress);
      setDisplayShadowLength(startShadowLength + (targetShadowLength - startShadowLength) * easeProgress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
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
  }, [data]);

  const dataItems = [
    { label: '高度角', value: `${displayAltitude.toFixed(1)}°` },
    { label: '影长', value: displayAltitude > 0 ? `${(displayShadowLength * GNOMON_HEIGHT).toFixed(1)}尺` : '--' },
    { label: '杆高', value: `${GNOMON_HEIGHT}尺` },
  ];

  return (
    <div className="ancient-card transition-all duration-500">
      <div className="ancient-card-inner p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-10">
          {dataItems.map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-[10px] sm:text-xs opacity-50 mb-0.5 font-kai leading-none">{item.label}</p>
              <p className="text-sm sm:text-lg md:text-2xl font-bold font-serif transition-all duration-300 leading-tight"
                 style={{ color: theme.textPrimary }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
