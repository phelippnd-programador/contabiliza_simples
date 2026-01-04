import React from "react";
import { AppTextSearch } from "../input/AppTextSearch";
import type { NcmItem } from "../../../shared/services/ncm";
import { searchNcm } from "../../../shared/services/ncm";

type Props = {
  label?: string;
  required?: boolean;
  value?: NcmItem | null;
  onChange: (item: NcmItem | null) => void;
  onChangeCodigo?: (codigo: string | null) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  minCharsToSearch?: number;
  debounceMs?: number;
};

export function NcmPicker({
  label = "NCM",
  required,
  value,
  onChange,
  onChangeCodigo,
  placeholder = "Digite o NCM ou descricao",
  helperText = "Digite e selecione na lista.",
  error,
  disabled,
  minCharsToSearch = 2,
  debounceMs = 300,
}: Props) {
  return (
    <AppTextSearch<NcmItem>
      label={label}
      required={required}
      value={value}
      onChange={(item) => {
        onChange(item);
        if (onChangeCodigo) {
          onChangeCodigo(item?.codigo ?? null);
        }
      }}
      placeholder={placeholder}
      helperText={helperText}
      error={error}
      disabled={disabled}
      minCharsToSearch={minCharsToSearch}
      debounceMs={debounceMs}
      onSearch={(q, signal) => searchNcm(q, signal)}
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
          <div className="text-xs text-gray-600">{item.descricao}</div>
        </>
      )}
    />
  );
}
