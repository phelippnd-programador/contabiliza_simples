export const toIsoDate = (value: string) => {
  const raw = value.trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  const matchShort = raw.match(/^(\d{2})[\/\-](\d{2})$/);
  if (matchShort) {
    const [, day, month] = matchShort;
    const year = new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }
  return raw;
};
