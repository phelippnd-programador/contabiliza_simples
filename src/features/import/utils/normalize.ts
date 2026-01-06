export const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b\d{5,}\b/g, "")
    .trim()
    .toUpperCase();

export const normalizeDate = (value: string) =>
  value.trim();

export const normalizeAmount = (value: number) =>
  Math.round(value);
