'use client';

import { useState } from 'react';
import { Season, SEASON_THEMES, SolarTermData } from '../types';
import AiChatModal from './AiChatModal';

interface HistoricalInfoProps {
  season: Season;
  solarData: SolarTermData | null;
}

const SECTIONS = [
  {
    icon: '史',
    title: '历史背景',
    content: '土圭是中国古代重要的天文测量仪器，最早可追溯至周代。《周礼》记载："以土圭之法测土深，正日景，以求地中。"古人通过在平地上竖立标杆，观测正午时分太阳投射的影子长度，从而测定节气、确定方位、测量纬度。',
  },
  {
    icon: '理',
    title: '科学原理',
    content: '太阳高度角是太阳光线与地平面的夹角。由于地球公转轨道倾斜（黄赤交角约23.5°），太阳直射点在南北回归线之间往复移动，导致不同季节太阳高度角不同。影长 = 杆高 / tan(太阳高度角)。',
  },
  {
    icon: '用',
    title: '实际应用',
    content: '确定二十四节气，指导农业生产；测定地理纬度，绘制地图；确定正南正北方向，规划城市布局；制定历法，安排祭祀活动。',
  },
  {
    icon: '问',
    title: '为什么高度角不同',
    content: '地球自转轴与公转轨道平面呈23.5°倾角，导致太阳直射点在南北回归线之间移动。夏至时太阳直射北回归线，北半球太阳高度角最大；冬至时太阳直射南回归线，北半球太阳高度角最小；春分和秋分时太阳直射赤道，太阳高度角居中且相等。',
  },
];

export default function HistoricalInfo({ season, solarData }: HistoricalInfoProps) {
  const theme = SEASON_THEMES[season];
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="ancient-card animate-fade-in transition-all duration-500">
      <div className="ancient-card-inner p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h3 className="text-sm sm:text-lg md:text-xl font-bold font-serif flex items-center gap-2 sm:gap-3"
              style={{ color: theme.textPrimary }}>
            <span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold text-white shrink-0"
                  style={{ background: theme.accent }}>
              典
            </span>
            土圭之法 · 历史与原理
          </h3>
          <button onClick={() => setChatOpen(true)}
                  className="text-xs sm:text-sm font-serif tracking-wider transition-opacity hover:opacity-70 shrink-0"
                  style={{ color: theme.accent }}>
            解读
          </button>
        </div>

        <AiChatModal open={chatOpen} onClose={() => setChatOpen(false)} theme={theme} solarData={solarData} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          {SECTIONS.map((section) => (
            <section
              key={section.title}
              className="rounded p-2.5 sm:p-3 md:p-4 transition-all duration-500"
              style={{
                background: theme.accentLight + '40',
                border: `1px solid ${theme.borderColor}40`,
              }}
            >
              <h4 className="font-bold text-xs sm:text-sm md:text-base mb-1 sm:mb-2 font-serif flex items-center gap-1.5 sm:gap-2"
                  style={{ color: theme.accent }}>
                <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded text-[10px] sm:text-xs font-bold shrink-0"
                      style={{ background: theme.accent + '20', color: theme.accent }}>
                  {section.icon}
                </span>
                {section.title}
              </h4>
              <p className="leading-relaxed text-[11px] sm:text-xs md:text-sm font-kai" style={{ color: theme.textPrimary }}>
                {section.content}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
