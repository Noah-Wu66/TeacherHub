export type SolarTerm = '春分' | '夏至' | '秋分' | '冬至';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SolarTermData {
  name: string;
  date: string;
  solarAltitude: number; // 太阳高度角（度）
  shadowLength: number; // 相对影长（以杆高为1）
  hourAngle?: number; // 太阳时角（度），正午为0
  description: string;
  astronomicalMeaning: string;
  color: string;
}

export interface SeasonTheme {
  season: Season;
  label: string;
  bgFrom: string;
  bgTo: string;
  accent: string;
  accentLight: string;
  textPrimary: string;
  borderColor: string;
  canvasSky: string[];
  canvasGround: string;
  canvasGroundLine: string;
  canvasGroundHatch: string;
}

export const SEASON_THEMES: Record<Season, SeasonTheme> = {
  spring: {
    season: 'spring',
    label: '春',
    bgFrom: '#f5efe6',
    bgTo: '#e8ddd0',
    accent: '#6b8e5a',
    accentLight: '#d4e4cb',
    textPrimary: '#4a5d3a',
    borderColor: '#b5c4a8',
    canvasSky: ['#c8e6c9', '#dcedc8', '#f1f8e9', '#fff9c4'],
    canvasGround: '#a8c090',
    canvasGroundLine: '#6b8e5a',
    canvasGroundHatch: '#7da068',
  },
  summer: {
    season: 'summer',
    label: '夏',
    bgFrom: '#fdf6ec',
    bgTo: '#f0e4d0',
    accent: '#c0392b',
    accentLight: '#f5d0cc',
    textPrimary: '#8b2500',
    borderColor: '#d4a574',
    canvasSky: ['#1565c0', '#42a5f5', '#90caf9', '#fff59d'],
    canvasGround: '#c9a87c',
    canvasGroundLine: '#8b7355',
    canvasGroundHatch: '#b8976a',
  },
  autumn: {
    season: 'autumn',
    label: '秋',
    bgFrom: '#f9f0e3',
    bgTo: '#ecdcc5',
    accent: '#bf6c2e',
    accentLight: '#f0d8b8',
    textPrimary: '#7a4a1e',
    borderColor: '#c9a87c',
    canvasSky: ['#ff8f00', '#ffb74d', '#ffe0b2', '#fff8e1'],
    canvasGround: '#c4a265',
    canvasGroundLine: '#8b7355',
    canvasGroundHatch: '#b09050',
  },
  winter: {
    season: 'winter',
    label: '冬',
    bgFrom: '#f0f0f0',
    bgTo: '#e0e0e0',
    accent: '#37474f',
    accentLight: '#cfd8dc',
    textPrimary: '#263238',
    borderColor: '#90a4ae',
    canvasSky: ['#546e7a', '#78909c', '#b0bec5', '#cfd8dc'],
    canvasGround: '#d7ccc8',
    canvasGroundLine: '#8d6e63',
    canvasGroundHatch: '#a1887f',
  },
};

// 2026年四季起点（按节气）
// 立春 2/4, 立夏 5/5, 立秋 8/7, 立冬 11/7
// 用 [月, 日] 表示
const SEASON_BOUNDARIES_2026: { season: Season; month: number; day: number }[] = [
  { season: 'spring', month: 2, day: 4 },   // 立春
  { season: 'summer', month: 5, day: 5 },   // 立夏
  { season: 'autumn', month: 8, day: 7 },   // 立秋
  { season: 'winter', month: 11, day: 7 },  // 立冬
];

export function getSeasonFromDate(month: number, day: number): Season {
  // 从后往前匹配，找到第一个 <= 当前日期的节气
  for (let i = SEASON_BOUNDARIES_2026.length - 1; i >= 0; i--) {
    const b = SEASON_BOUNDARIES_2026[i];
    if (month > b.month || (month === b.month && day >= b.day)) {
      return b.season;
    }
  }
  // 1月1日 ~ 2月3日 还是冬天（上一年立冬之后）
  return 'winter';
}

// 保留旧函数签名兼容
export function getSeasonFromMonth(month: number): Season {
  return getSeasonFromDate(month, 15);
}

export function getSeasonFromTerm(term: SolarTerm): Season {
  switch (term) {
    case '春分': return 'spring';
    case '夏至': return 'summer';
    case '秋分': return 'autumn';
    case '冬至': return 'winter';
  }
}

export const SOLAR_TERMS_DATA: Record<SolarTerm, SolarTermData> = {
  '春分': {
    name: '春分',
    date: '3月20日或21日',
    solarAltitude: 55,
    shadowLength: 0.70,
    description: '春分时节，昼夜平分，太阳直射赤道',
    astronomicalMeaning: '太阳从南半球向北半球移动，经过赤道的时刻。此时全球各地昼夜等长，各为12小时。',
    color: '#10B981', // 绿色代表春天
  },
  '夏至': {
    name: '夏至',
    date: '6月21日或22日',
    solarAltitude: 78.5,
    shadowLength: 0.20,
    description: '夏至日，北半球白昼最长，太阳直射北回归线',
    astronomicalMeaning: '太阳直射点到达最北端（北纬23.5°），北半球正午太阳高度角达到全年最大值，影子最短。',
    color: '#EF4444', // 红色代表夏天
  },
  '秋分': {
    name: '秋分',
    date: '9月22日或23日',
    solarAltitude: 55,
    shadowLength: 0.70,
    description: '秋分时节，昼夜再次平分，太阳再次直射赤道',
    astronomicalMeaning: '太阳从北半球向南半球移动，再次经过赤道。昼夜等长，秋季的中点。',
    color: '#F59E0B', // 橙色代表秋天
  },
  '冬至': {
    name: '冬至',
    date: '12月21日或22日',
    solarAltitude: 31.5,
    shadowLength: 1.63,
    description: '冬至日，北半球白昼最短，太阳直射南回归线',
    astronomicalMeaning: '太阳直射点到达最南端（南纬23.5°），北半球正午太阳高度角达到全年最小值，影子最长。',
    color: '#3B82F6', // 蓝色代表冬天
  },
};

export const LATITUDE = 35; // 观测地纬度（北纬35°）
export const GNOMON_HEIGHT = 8; // 土圭立杆高度（尺）

/**
 * 根据日期和时间计算太阳高度角
 * hour: 0~23, minute: 0~59
 * 使用时角公式: sin(h) = sin(φ)sin(δ) + cos(φ)cos(δ)cos(ω)
 * ω = (hour - 12) * 15° (时角，正午为0)
 */
export function calculateSolarDataByDateTime(
  year: number, month: number, day: number,
  hour: number, minute: number
): SolarTermData | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000) + 1;

  // 太阳赤纬
  const declination = 23.44 * Math.sin((2 * Math.PI * (dayOfYear - 81)) / 365);
  const decRad = declination * Math.PI / 180;
  const latRad = LATITUDE * Math.PI / 180;

  // 时角：正午12:00为0，每小时15度
  const solarTime = hour + minute / 60;
  const hourAngle = (solarTime - 12) * 15; // 度
  const haRad = hourAngle * Math.PI / 180;

  // 太阳高度角公式
  const sinAltitude = Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const rawAltitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude))) * 180 / Math.PI;

  // 允许负值（太阳在地平线以下），但限制范围
  const solarAltitude = Math.max(-90, Math.min(89.9, rawAltitude));

  // 影长：太阳在地平线以下时无影子
  const shadowLength = solarAltitude > 0
    ? 1 / Math.tan(solarAltitude * Math.PI / 180)
    : 0;

  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return {
    name: `${month}月${day}日 ${timeStr}`,
    date: `${year}年${month}月${day}日`,
    solarAltitude: Number(solarAltitude.toFixed(1)),
    shadowLength: Number(shadowLength.toFixed(3)),
    hourAngle: Number(hourAngle.toFixed(1)),
    description: solarAltitude > 0
      ? `该时刻太阳高度角约为${solarAltitude.toFixed(1)}°。`
      : `该时刻太阳在地平线以下（${solarAltitude.toFixed(1)}°），无日影。`,
    astronomicalMeaning: `太阳赤纬约${declination.toFixed(1)}°，时角${hourAngle.toFixed(1)}°。`,
    color: getSeasonColor(month, day),
  };
}

export function calculateSolarDataByDate(year: number, month: number, day: number): SolarTermData | null {
  return calculateSolarDataByDateTime(year, month, day, 12, 0);
}

function getSeasonColor(month: number, day: number): string {
  const s = getSeasonFromDate(month, day);
  switch (s) {
    case 'spring': return '#10B981';
    case 'summer': return '#EF4444';
    case 'autumn': return '#F59E0B';
    case 'winter': return '#3B82F6';
  }
}

// 2026年节日与节气数据（支持同一天多个事件）
export const SPECIAL_DATES_2026: { month: number; day: number; name: string }[] = [
  // 二十四节气
  { month: 1, day: 5, name: '小寒' },
  { month: 1, day: 20, name: '大寒' },
  { month: 2, day: 4, name: '立春' },
  { month: 2, day: 18, name: '雨水' },
  { month: 3, day: 5, name: '惊蛰' },
  { month: 3, day: 20, name: '春分' },
  { month: 3, day: 20, name: '龙抬头' },
  { month: 4, day: 5, name: '清明' },
  { month: 4, day: 20, name: '谷雨' },
  { month: 5, day: 5, name: '立夏' },
  { month: 5, day: 21, name: '小满' },
  { month: 6, day: 5, name: '芒种' },
  { month: 6, day: 21, name: '夏至' },
  { month: 6, day: 21, name: '父亲节' },
  { month: 7, day: 7, name: '小暑' },
  { month: 7, day: 23, name: '大暑' },
  { month: 8, day: 7, name: '立秋' },
  { month: 8, day: 23, name: '处暑' },
  { month: 9, day: 7, name: '白露' },
  { month: 9, day: 23, name: '秋分' },
  { month: 10, day: 8, name: '寒露' },
  { month: 10, day: 23, name: '霜降' },
  { month: 11, day: 7, name: '立冬' },
  { month: 11, day: 22, name: '小雪' },
  { month: 12, day: 7, name: '大雪' },
  { month: 12, day: 22, name: '冬至' },
  // 农历节日
  { month: 1, day: 26, name: '腊八节' },
  { month: 2, day: 10, name: '小年（北方）' },
  { month: 2, day: 11, name: '小年（南方）' },
  { month: 2, day: 16, name: '除夕' },
  { month: 2, day: 17, name: '春节' },
  { month: 3, day: 3, name: '元宵节' },
  { month: 6, day: 19, name: '端午节' },
  { month: 8, day: 19, name: '七夕节' },
  { month: 9, day: 25, name: '中秋节' },
  { month: 10, day: 18, name: '重阳节' },
  // 公历节日
  { month: 1, day: 1, name: '元旦' },
  { month: 5, day: 1, name: '劳动节' },
  { month: 5, day: 4, name: '青年节' },
  { month: 5, day: 10, name: '母亲节' },
  { month: 9, day: 10, name: '教师节' },
  { month: 9, day: 18, name: '九一八纪念日' },
  { month: 10, day: 1, name: '国庆节' },
];

export function getAllSpecialDateNames(month: number, day: number): string[] {
  return SPECIAL_DATES_2026
    .filter(d => d.month === month && d.day === day)
    .map(d => d.name);
}
