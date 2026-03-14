'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SolarTermData, Season, SEASON_THEMES, getSeasonFromDate } from './types';
import TuguiCanvas from './components/TuguiCanvas';
import DataDisplay from './components/DataDisplay';
import HistoricalInfo from './components/HistoricalInfo';
import CustomDateSimulator from './components/CustomDateSimulator';
import SeasonalEffects from './components/SeasonalEffects';
import SeasonalAudio from './components/SeasonalAudio';
import CurrentDateCard from './components/CurrentDateCard';

export default function Home() {
  const [customData, setCustomData] = useState<SolarTermData | null>(null);
  const [fallbackSeason, setFallbackSeason] = useState<Season>('spring');

  const currentData = customData;

  useEffect(() => {
    const now = new Date();
    setFallbackSeason(getSeasonFromDate(now.getMonth() + 1, now.getDate()));
  }, []);

  const season: Season = useMemo(() => {
    if (customData) {
      const matchM = customData.date.match(/(\d+)月/);
      const matchD = customData.date.match(/月(\d+)日/);
      if (matchM && matchD) {
        return getSeasonFromDate(Number(matchM[1]), Number(matchD[1]));
      }
    }
    return fallbackSeason;
  }, [customData, fallbackSeason]);

  const theme = SEASON_THEMES[season];

  // 动态更新 CSS 变量
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--season-bg-from', theme.bgFrom);
    root.style.setProperty('--season-bg-to', theme.bgTo);
    root.style.setProperty('--season-accent', theme.accent);
    root.style.setProperty('--season-accent-light', theme.accentLight);
    root.style.setProperty('--season-text', theme.textPrimary);
    root.style.setProperty('--season-border', theme.borderColor);
  }, [theme]);

  const handleSimulateByDate = useCallback((data: SolarTermData) => {
    setCustomData(data);
  }, []);

  return (
    <main className="relative min-h-screen py-3 sm:py-6 md:py-8 px-2 sm:px-3 md:px-4">
      <SeasonalEffects season={season} />
      <SeasonalAudio season={season} />
      <div className="max-w-5xl mx-auto relative z-10">
        {/* 标题 */}
        <header className="text-center mb-3 sm:mb-6 md:mb-8 animate-slide-in">
          <div className="inline-block relative">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-widest"
              style={{ color: theme.accent }}>
              土圭之法
            </h1>
            <p className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2 font-kai tracking-wider opacity-70">
              以土圭之法测土深 正日景 以求地中
            </p>
            <div className="ancient-divider mt-2 sm:mt-3" />
          </div>
        </header>

        <section className="mb-3 sm:mb-6 md:mb-8 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-3 sm:gap-5 md:gap-6 md:items-stretch">
          {/* 右侧：日期模拟 + 当前日期（移动端仍在上方） */}
          <div className="order-1 md:order-2 min-w-0 grid grid-cols-1 gap-3 sm:gap-5 md:gap-6 content-start">
            <CustomDateSimulator
              onSimulate={handleSimulateByDate}
              season={season}
            />
            <CurrentDateCard data={currentData} season={season} />
          </div>

          {/* 左侧：展示区 */}
          <div className="order-2 md:order-1 min-w-0 md:h-full flex flex-col">
            {currentData && (
              <div className="mb-3 sm:mb-5 md:mb-6">
                <DataDisplay data={currentData} season={season} />
              </div>
            )}

            {currentData && (
              <div className="md:flex-1">
                <div className="ancient-card overflow-hidden h-[280px] sm:h-[420px] md:h-full">
                  <div className="ancient-card-inner w-full h-full">
                    <TuguiCanvas solarTermData={currentData} season={season} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 历史信息 */}
        <div className="mb-3 sm:mb-6 md:mb-8">
          <HistoricalInfo season={season} solarData={currentData} />
        </div>

        {/* 页脚 */}
        <footer className="text-center mt-4 sm:mt-8 pb-4 sm:pb-6">
          <div className="ancient-divider mb-3 sm:mb-4" />
          <p className="text-xs opacity-60 font-kai tracking-wider">
            切换节气或输入月日 观察太阳高度角和日影长度的变化
          </p>
        </footer>
      </div>
    </main>
  );
}
