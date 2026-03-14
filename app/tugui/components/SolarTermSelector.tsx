'use client';

import { SolarTerm, Season, SEASON_THEMES } from '../types';

interface SolarTermSelectorProps {
  selectedTerm: SolarTerm;
  onSelectTerm: (term: SolarTerm) => void;
  season: Season;
}

const TERM_CONFIG: { term: SolarTerm; icon: string; label: string; season: Season }[] = [
  { term: '春分', icon: '春', label: '春分', season: 'spring' },
  { term: '夏至', icon: '夏', label: '夏至', season: 'summer' },
  { term: '秋分', icon: '秋', label: '秋分', season: 'autumn' },
  { term: '冬至', icon: '冬', label: '冬至', season: 'winter' },
];

export default function SolarTermSelector({ selectedTerm, onSelectTerm, season }: SolarTermSelectorProps) {
  const theme = SEASON_THEMES[season];

  return (
    <div className="flex gap-4 md:gap-6 justify-center items-center flex-wrap">
      {TERM_CONFIG.map(({ term, icon, label, season: termSeason }) => {
        const isSelected = selectedTerm === term;
        const termTheme = SEASON_THEMES[termSeason];

        return (
          <button
            key={term}
            type="button"
            onClick={() => onSelectTerm(term)}
            aria-pressed={isSelected}
            aria-label={`选择${term}`}
            className={`
              relative flex flex-col items-center gap-2
              transition-all duration-500
              ${isSelected ? 'scale-110' : 'scale-100 hover:scale-105 active:scale-95'}
            `}
          >
            {/* 圆形印章风格按钮 */}
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center
                         transition-all duration-500 relative"
              style={{
                background: isSelected ? termTheme.accent : 'rgba(255,253,248,0.85)',
                border: `2px solid ${isSelected ? termTheme.accent : termTheme.borderColor}`,
                boxShadow: isSelected
                  ? `0 4px 16px ${termTheme.accent}40, inset 0 1px 2px rgba(255,255,255,0.2)`
                  : '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <span
                className="text-2xl md:text-3xl font-bold font-serif transition-colors duration-500"
                style={{ color: isSelected ? '#fff' : termTheme.accent }}
              >
                {icon}
              </span>
            </div>

            {/* 文字标签 */}
            <span
              className="text-xs md:text-sm font-medium font-kai tracking-wider transition-all duration-500"
              style={{
                color: isSelected ? termTheme.accent : 'rgba(0,0,0,0.45)',
                fontWeight: isSelected ? 700 : 400,
              }}
            >
              {label}
            </span>

            {/* 选中指示器 - 小圆点 */}
            <div
              className="w-1.5 h-1.5 rounded-full transition-all duration-500"
              style={{
                background: isSelected ? termTheme.accent : 'transparent',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
