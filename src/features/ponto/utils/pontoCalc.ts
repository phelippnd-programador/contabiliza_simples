const MINUTES_PER_DAY = 24 * 60;
const NIGHT_RANGES = [
  [22 * 60, MINUTES_PER_DAY],
  [0, 5 * 60],
];

export const parseTimeToMinutes = (value?: string) => {
  if (!value) return null;
  const [hRaw, mRaw] = value.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const overlapMinutes = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));

export const calcIntervalMinutes = (start?: string, end?: string) => {
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (startMin === null || endMin === null) return 0;
  let diff = endMin - startMin;
  if (diff < 0) diff += MINUTES_PER_DAY;
  return diff;
};

export const calcNightMinutes = (start?: string, end?: string) => {
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (startMin === null || endMin === null) return 0;
  let intervalEnd = endMin;
  if (intervalEnd <= startMin) intervalEnd += MINUTES_PER_DAY;
  let total = 0;
  NIGHT_RANGES.forEach(([rangeStart, rangeEnd]) => {
    total += overlapMinutes(startMin, intervalEnd, rangeStart, rangeEnd);
    total += overlapMinutes(startMin, intervalEnd, rangeStart + MINUTES_PER_DAY, rangeEnd + MINUTES_PER_DAY);
  });
  const reduced = total * (60 / 52.5);
  return Number(reduced.toFixed(2));
};

export const calcDayMinutes = (entrada1?: string, saida1?: string, entrada2?: string, saida2?: string) =>
  calcIntervalMinutes(entrada1, saida1) + calcIntervalMinutes(entrada2, saida2);

export const calcDayNightMinutes = (
  entrada1?: string,
  saida1?: string,
  entrada2?: string,
  saida2?: string
) => calcNightMinutes(entrada1, saida1) + calcNightMinutes(entrada2, saida2);

export const minutesToHours = (minutes: number) => Number((minutes / 60).toFixed(2));

export const parseDate = (value: string) => new Date(`${value}T00:00:00`);

export const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const getCompetenciaRange = (competencia: string) => {
  const [yearRaw, monthRaw] = competencia.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    end: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  };
};

export const listDatesBetween = (start: string, end: string) => {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const result: string[] = [];
  const pad = (value: number) => String(value).padStart(2, "0");
  const current = new Date(startDate);
  while (current <= endDate) {
    result.push(
      `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`
    );
    current.setDate(current.getDate() + 1);
  }
  return result;
};

export const countWeekdaysInMonth = (competencia: string) => {
  const [yearRaw, monthRaw] = competencia.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw) - 1;
  const date = new Date(year, month, 1);
  let count = 0;
  while (date.getMonth() === month) {
    if (!isWeekend(date)) count += 1;
    date.setDate(date.getDate() + 1);
  }
  return count;
};
