const onlyDigits = (value: string) => value.replace(/\D+/g, "");

export const isCpfValid = (value: string) => {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  return true;
};

export const sanitizeMoney = (value: string) => {
  const digits = onlyDigits(value);
  if (!digits) return 0;
  return Number(digits) / 100;
};

export const isDateRangeValid = (inicio?: string, fim?: string) => {
  if (!inicio || !fim) return true;
  return inicio <= fim;
};
