import React from "react";
import { AppTextSearch } from "../input/AppTextSearch";
import { searchBanks, type BankItem } from "../../../shared/services/banks";

type Props = {
  label?: string;
  required?: boolean;
  value?: BankItem | null;
  onChange: (item: BankItem | null) => void;
  onChangeCodigo?: (codigo: string | null) => void;
  onChangeNome?: (nome: string | null) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  minCharsToSearch?: number;
  debounceMs?: number;
};

export function BankPicker({
  label = "Banco",
  required,
  value,
  onChange,
  onChangeCodigo,
  onChangeNome,
  placeholder = "Digite o nome do banco ou codigo (ex: 341, Itau)",
  helperText = "Digite e selecione na lista.",
  error,
  disabled,
  minCharsToSearch = 1,
  debounceMs = 250,
}: Props) {
  return (
    <AppTextSearch<BankItem>
      label={label}
      required={required}
      value={value}
      onChange={(item) => {
        onChange(item);
        if (onChangeCodigo) {
          onChangeCodigo(item?.code != null ? String(item.code) : null);
        }
        if (onChangeNome) {
          onChangeNome(item?.name ?? null);
        }
      }}
      placeholder={placeholder}
      helperText={helperText}
      error={error}
      disabled={disabled}
      minCharsToSearch={minCharsToSearch}
      debounceMs={debounceMs}
      onSearch={searchBanks}
      getDisplayValue={(item) => {
        const code = item?.code != null ? String(item.code) : "";
        const name = item?.name ?? "";
        if (!code) return name;
        if (!name) return code;
        return `${code} - ${name}`;
      }}
      getKey={(item, index) => String(item.code ?? item.ispb ?? index)}
      renderItem={(item) => (
        <>
          <div className="font-medium">
            {item.code != null ? `${item.code} - ${item.name}` : item.name}
          </div>
          {item.fullName ? (
            <div className="text-xs text-gray-600">{item.fullName}</div>
          ) : null}
        </>
      )}
    />
  );
}
