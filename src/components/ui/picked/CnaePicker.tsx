import React from "react";
import { maskCnae, searchIbgeCnae, type CnaeItem } from "../../../shared/services/ibgeCnae";
import { AppTextSearch } from "../input/AppTextSearch";
import { cachedCnaeSearch } from "../../../shared/utils/cnaeSearchCache";

type Props = {
  label?: string;
  required?: boolean;

  value?: CnaeItem | null;
  onChange: (item: CnaeItem | null) => void;

  // opcional: se quiser guardar no form so numeros
  onChangeCodigo?: (codigoNumerico: string | null) => void;

  placeholder?: string;
  helperText?: string;
  error?: string;

  disabled?: boolean;
  minCharsToSearch?: number;
  debounceMs?: number;
};

export function CnaePicker({
  label = "CNAE Principal",
  required,
  value,
  onChange,
  onChangeCodigo,
  placeholder = "Digite o CNAE (ex: 6201-5/01) ou descricao (ex: software)",
  helperText = "Digite e selecione na lista.",
  error,
  disabled,
  minCharsToSearch = 2,
  debounceMs = 300,
}: Props) {
  const onSearchCached = (q: string, signal?: AbortSignal) =>
    cachedCnaeSearch(q, searchIbgeCnae, signal);
  return (
    <AppTextSearch<CnaeItem>
      label={label}
      required={required}
      value={value}
      onChange={(item) => {
        onChange(item);
        if (onChangeCodigo) {
          const digits = item?.codigo ? item.codigo.replace(/\D/g, "") : null;
          onChangeCodigo(digits);
        }
      }}
      placeholder={placeholder}
      helperText={helperText}
      error={error ? "Selecione um CNAE principal" : undefined}
      disabled={disabled}
      minCharsToSearch={minCharsToSearch}
      debounceMs={debounceMs}
      onSearch={onSearchCached}
      transformQuery={(raw) => {
        // aplica mascara se comecar com numero
        const trimmed = raw.trim();
        const startsWithDigit = /^\d/.test(trimmed);
        return startsWithDigit ? maskCnae(trimmed) : raw;
      }}
      getDisplayValue={(item) => {
        const codigo = item?.codigo ?? "";
        const descricao = item?.descricao ?? "";
        if (!codigo && !descricao) return "";
        if (!descricao) return codigo;
        if (!codigo) return descricao;
        return `${codigo} - ${descricao}`;
      }}
      getKey={(item) => item.codigo}
      renderItem={(item) => (
        <>
          <div className="font-medium">{item.codigo}</div>
          <div className="text-xs text-slate-500">{item.descricao}</div>
        </>
      )}
    />
  );
}
