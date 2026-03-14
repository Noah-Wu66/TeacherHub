'use client';

import { useEffect, useRef, useState } from 'react';
import { SolarTermData, Season, SEASON_THEMES, getAllSpecialDateNames } from '../types';

interface CurrentDateCardProps {
  data: SolarTermData | null;
  season: Season;
}

export default function CurrentDateCard({ data, season }: CurrentDateCardProps) {
  const theme = SEASON_THEMES[season];
  const displayName = data ? data.name.replace(/^\d+年/, '') : '--';
  const [datePart, timePart = '--:--'] = displayName.split(' ');

  // 从 data.date 中提取月和日，查找今天是什么特殊日子
  let specialNames: string[] = [];
  if (data?.date) {
    const matchM = data.date.match(/(\d+)月/);
    const matchD = data.date.match(/月(\d+)日/);
    if (matchM && matchD) {
      specialNames = getAllSpecialDateNames(Number(matchM[1]), Number(matchD[1]));
    }
  }

  // 延迟显示节气标签：停留 1s 以上才展开
  const [visibleNames, setVisibleNames] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const specialKey = specialNames.join(',');

  useEffect(() => {
    // 清除上一次的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (specialNames.length > 0) {
      // 有节气/节日时，延迟 1s 后显示
      timerRef.current = setTimeout(() => {
        setVisibleNames(specialNames);
      }, 1000);
    } else {
      // 没有节气时，立即收起
      setVisibleNames([]);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialKey]);

  // 测量内容真实高度，用于动画
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [visibleNames]);

  const isExpanded = visibleNames.length > 0;

  return (
    <div className="ancient-card min-h-[120px] sm:min-h-[132px] md:min-h-[144px] transition-all duration-500 flex flex-col">
      <div className="ancient-card-inner p-2.5 sm:p-3 md:p-4 flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-pulse mb-2 sm:mb-3"
             style={{ background: theme.accent }} />
        <p className="text-xs sm:text-sm opacity-60 mb-1 font-kai" style={{ color: theme.textPrimary }}>
          当前日期
        </p>
        <p className="text-lg sm:text-xl md:text-2xl font-bold font-serif leading-tight"
           style={{ color: theme.accent }}>
          {datePart}
        </p>
        <p className="text-sm sm:text-base md:text-lg font-serif mt-0.5"
           style={{ color: theme.textPrimary }}>
          {timePart}
        </p>

        {/* 节气/节日标签 — 伸缩动画容器 */}
        <div
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{
            maxHeight: isExpanded ? `${contentHeight}px` : '0px',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div ref={contentRef} className="pt-2 sm:pt-3 flex flex-wrap justify-center gap-1.5">
            {visibleNames.map((name) => (
              <span
                key={name}
                className="inline-block px-2 py-0.5 rounded text-xs sm:text-sm font-kai transition-transform duration-300"
                style={{
                  background: theme.accentLight,
                  color: theme.accent,
                  border: `1px solid ${theme.borderColor}`,
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
