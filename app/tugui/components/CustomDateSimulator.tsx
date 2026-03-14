'use client';

import { useEffect, useMemo, useState } from 'react';
import { SolarTermData, Season, SEASON_THEMES, calculateSolarDataByDateTime } from '../types';

interface CustomDateSimulatorProps {
  onSimulate: (data: SolarTermData) => void;
  season: Season;
}

const DATE_ERROR_MESSAGE = '日期无效，请按正确的月日填写。';
const SOLAR_TERM_MARKERS = [
  { name: '春分', month: 3, day: 20, icon: '🌸' },
  { name: '夏至', month: 6, day: 21, icon: '☀️' },
  { name: '秋分', month: 9, day: 23, icon: '🍂' },
  { name: '冬至', month: 12, day: 22, icon: '❄️' },
] as const;

function getDaysInYear(year: number): number {
  const start = Date.UTC(year, 0, 1);
  const next = Date.UTC(year + 1, 0, 1);
  return Math.round((next - start) / 86400000);
}

function getDayOfYear(year: number, month: number, day: number): number {
  const date = Date.UTC(year, month - 1, day);
  const start = Date.UTC(year, 0, 1);
  return Math.floor((date - start) / 86400000) + 1;
}

function getDateByDayOfYear(year: number, dayOfYear: number): { month: number; day: number } {
  const date = new Date(Date.UTC(year, 0, dayOfYear));
  return {
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/** 分钟数转 HH:MM */
function minutesToTimeStr(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function CustomDateSimulator({ onSimulate, season }: CustomDateSimulatorProps) {
  const [year, setYear] = useState('2024');
  const [month, setMonth] = useState('3');
  const [day, setDay] = useState('20');
  const [timeMinutes, setTimeMinutes] = useState(720); // 默认12:00（正午）
  const [error, setError] = useState('');
  const theme = SEASON_THEMES[season];

  useEffect(() => {
    const today = new Date();
    setYear(String(today.getFullYear()));
    setMonth(String(today.getMonth() + 1));
    setDay(String(today.getDate()));
  }, []);

  const parsedYear = Number.parseInt(year, 10);
  const parsedMonth = Number.parseInt(month, 10);
  const parsedDay = Number.parseInt(day, 10);
  const hour = Math.floor(timeMinutes / 60);
  const minute = timeMinutes % 60;

  const currentResult = useMemo(
    () => calculateSolarDataByDateTime(parsedYear, parsedMonth, parsedDay, hour, minute),
    [parsedYear, parsedMonth, parsedDay, hour, minute],
  );

  const maxDayOfYear = useMemo(() => {
    if (!Number.isInteger(parsedYear) || parsedYear < 1) return 365;
    return getDaysInYear(parsedYear);
  }, [parsedYear]);

  const sliderValue = useMemo(() => {
    if (!currentResult) return 1;
    return getDayOfYear(parsedYear, parsedMonth, parsedDay);
  }, [currentResult, parsedYear, parsedMonth, parsedDay]);

  const markerPositions = useMemo(() => {
    if (!Number.isInteger(parsedYear) || parsedYear < 1) return [];
    return SOLAR_TERM_MARKERS.map((item) => {
      const dayOfYear = getDayOfYear(parsedYear, item.month, item.day);
      const left = ((dayOfYear - 1) / (maxDayOfYear - 1)) * 100;
      return { ...item, dayOfYear, left };
    });
  }, [maxDayOfYear, parsedYear]);

  useEffect(() => {
    if (!currentResult) {
      setError(DATE_ERROR_MESSAGE);
      return;
    }
    setError('');
    onSimulate(currentResult);
  }, [currentResult, onSimulate]);

  const handleSliderChange = (value: string) => {
    const sliderDay = Number.parseInt(value, 10);
    if (!Number.isInteger(parsedYear) || parsedYear < 1 || !Number.isInteger(sliderDay)) return;
    const nextDate = getDateByDayOfYear(parsedYear, sliderDay);
    setMonth(String(nextDate.month));
    setDay(String(nextDate.day));
  };

  const handleSolarTermJump = (dayOfYear: number) => {
    if (!Number.isInteger(parsedYear) || parsedYear < 1) return;
    const nextDate = getDateByDayOfYear(parsedYear, dayOfYear);
    setMonth(String(nextDate.month));
    setDay(String(nextDate.day));
  };

  return (
    <section className="ancient-card transition-all duration-500">
      <div className="ancient-card-inner p-3 sm:p-4 md:p-6">
        <h2 className="text-sm sm:text-base md:text-lg font-bold font-serif mb-2 sm:mb-3"
            style={{ color: theme.textPrimary }}>
          日期模拟
        </h2>

        {/* 月日输入 */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          {[
            { label: '月', value: month, setter: setMonth, placeholder: '1-12', min: 1, max: 12 },
            { label: '日', value: day, setter: setDay, placeholder: '1-31', min: 1, max: 31 },
          ].map(({ label, value, setter, placeholder, min, max }) => (
            <label key={label} className="flex flex-col gap-1 text-xs sm:text-sm font-kai" style={{ color: theme.textPrimary }}>
              {label}
              <input
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-serif focus:outline-none focus:ring-2 transition-all duration-300"
                style={{
                  background: 'rgba(255,253,248,0.9)',
                  border: `1px solid ${theme.borderColor}`,
                  color: theme.textPrimary,
                  outlineColor: theme.accent,
                } as React.CSSProperties}
                placeholder={placeholder}
              />
            </label>
          ))}
        </div>

        {/* 日期滑块区域 */}
        <div className="mt-3 sm:mt-4 rounded p-2 sm:p-3 transition-all duration-300"
             style={{ background: theme.accentLight + '30', border: `1px solid ${theme.borderColor}40` }}>
          {/* 日期范围 + 节气快捷按钮 */}
          <div className="mb-1.5 sm:mb-2">
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
              {markerPositions.map((marker) => (
                <button
                  key={marker.name}
                  type="button"
                  onClick={() => handleSolarTermJump(marker.dayOfYear)}
                  title={`${marker.name}（${marker.month}月${marker.day}日）`}
                  className="inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-kai transition-all active:scale-95 hover:opacity-80"
                  style={{
                    background: 'rgba(255,253,248,0.85)',
                    border: `1px solid ${theme.borderColor}80`,
                    color: theme.accent,
                  }}
                >
                  <span>{marker.icon}</span>
                  <span className="font-bold">{marker.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-between">
              <span className="text-[10px] sm:text-xs opacity-50 font-kai shrink-0">1月1日</span>
              <span className="text-[10px] sm:text-xs opacity-50 font-kai shrink-0">12月31日</span>
            </div>
          </div>

          {/* 日期滑块 */}
          <input
            type="range"
            min={1}
            max={maxDayOfYear}
            value={sliderValue}
            disabled={!Number.isInteger(parsedYear) || parsedYear < 1}
            onChange={(e) => handleSliderChange(e.target.value)}
            className="w-full disabled:opacity-50"
          />

          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-kai" style={{ color: theme.textPrimary }}>
            当前：{currentResult ? `${parsedMonth}月${parsedDay}日` : '--'}
          </p>
        </div>

        {/* 时间滑块区域 */}
        <div className="mt-2 sm:mt-3 rounded p-2 sm:p-3 transition-all duration-300"
             style={{ background: theme.accentLight + '30', border: `1px solid ${theme.borderColor}40` }}>
          {/* 时间范围标注 */}
          <div className="mb-1 sm:mb-2 flex items-center justify-between text-[10px] sm:text-xs opacity-50 font-kai">
            <span>0:00</span>
            <span className="font-serif font-bold text-xs sm:text-sm opacity-100"
                  style={{ color: theme.accent }}>
              {minutesToTimeStr(timeMinutes)}
            </span>
            <span>23:59</span>
          </div>

          {/* 时间滑块 */}
          <input
            type="range"
            min={0}
            max={1439}
            value={timeMinutes}
            onChange={(e) => setTimeMinutes(Number.parseInt(e.target.value, 10))}
            className="w-full"
          />

          {/* 快捷时间按钮 */}
          <div className="mt-1.5 sm:mt-2 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            {[
              { label: '日出', minutes: 360 },
              { label: '上午', minutes: 540 },
              { label: '正午', minutes: 720 },
              { label: '下午', minutes: 900 },
              { label: '日落', minutes: 1080 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setTimeMinutes(preset.minutes)}
                className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-kai transition-all active:scale-95"
                style={{
                  background: timeMinutes === preset.minutes ? theme.accent : 'rgba(255,253,248,0.8)',
                  color: timeMinutes === preset.minutes ? '#fff' : theme.textPrimary,
                  border: `1px solid ${theme.borderColor}60`,
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-red-700 font-kai">{error}</p> : null}
      </div>
    </section>
  );
}
