export const onlyDigits = (v: string) => v.replace(/\D+/g, "");

export const formatCEP = (v: string) => {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

export const formatCPF = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
};

export const formatCNPJ = (v: string) => {
  const d = onlyDigits(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export const formatCpfCnpj = (v: string) => {
  const d = onlyDigits(v);
  if (d.length <= 11) return formatCPF(d);
  return formatCNPJ(d);
};

export const formatPhoneBR = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);

  if (d.length <= 2) return d; // DDD
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; // celular 11 dígitos
};

// Moeda BR (entrada digitável) – mantém centavos
export const formatBRL = (v: string) => {
  const d = onlyDigits(v);
  const num = Number(d || "0") / 100;

  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};
export const formatNumericRange = (
  v: string,
  options?: {
    maxDigits?: number; // total de dígitos
    separator?: string;
  }
) => {
  const { maxDigits = 6, separator = " - " } = options || {};
  const d = onlyDigits(v).slice(0, maxDigits);

  if (d.length <= maxDigits / 2) return d;

  const mid = Math.ceil(d.length / 2);
  return `${d.slice(0, mid)}${separator}${d.slice(mid)}`;
};

export const formatRangeMinMax = (
  v: string,
  min = 0,
  max = 100
) => {
  const d = Number(onlyDigits(v));

  if (Number.isNaN(d)) return "";

  if (d < min) return String(min);
  if (d > max) return String(max);

  return String(d);
};
export const formatPercentBR = (v: string) => {
  const d = onlyDigits(v).slice(0, 5); // até 100,00
  if (!d) return "";

  const n = Number(d) / 100;
  const clamped = Math.min(n, 100);

  return clamped.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + "%";
};
export const formatBRLRangeClamp = (
  v: string,
  min: number,
  max: number
) => {
  // mantém só dígitos
  const d = onlyDigits(v);
  if (!d) return "";

  // converte para reais (centavos)
  const value = Number(d) / 100;
  if (Number.isNaN(value)) return "";

  // aplica o range
  const clamped = Math.min(Math.max(value, min), max);

  // formata como moeda BR
  return clamped.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};
export function formatCnae(codigo: string) {
  const digits = onlyDigits(codigo);
  if (digits.length !== 7) return codigo;
  return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5, 7)}`;
}
export function formatUF(raw: string) {
  return (raw || "").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
}


