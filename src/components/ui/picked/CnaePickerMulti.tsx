import React, { useMemo, useState } from "react";
import type { CnaeItem } from "../../../shared/services/ibgeCnae";
import { CnaePicker } from "./CnaePicker";

type Props = {
  label?: string;
  required?: boolean;

  // lista de CNAEs selecionados
  value: CnaeItem[];
  onChange: (items: CnaeItem[]) => void;

  // opcional: se quiser guardar no form so numeros
  onChangeCodigos?: (codigosNumericos: string[]) => void;

  placeholder?: string;
  helperText?: string;
  error?: string;

  disabled?: boolean;
  maxItems?: number;
};

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

export function CnaePickerMulti({
  label = "CNAEs Secundarios",
  required,
  value,
  onChange,
  onChangeCodigos,
  placeholder,
  helperText,
  error,
  disabled,
  maxItems,
}: Props) {
  // controla o picker atual (1 item por vez)
  const [current, setCurrent] = useState<CnaeItem | null>(null);

  const selectedDigits = useMemo(
    () => new Set(value.map((it) => onlyDigits(it.codigo)).filter(Boolean)),
    [value]
  );

  function emit(next: CnaeItem[]) {
    onChange(next);
    onChangeCodigos?.(next.map((it) => onlyDigits(it.codigo)).filter(Boolean));
  }

  function addItem(item: CnaeItem | null) {
    if (!item) return;

    const digits = onlyDigits(item.codigo);
    if (!digits) return;

    // bloqueia duplicado
    if (selectedDigits.has(digits)) {
      setCurrent(null);
      return;
    }

    // limite opcional
    if (maxItems !== undefined && value.length >= maxItems) return;

    emit([...value, item]);
    setCurrent(null);
  }

  function removeItem(digits: string) {
    emit(value.filter((it) => onlyDigits(it.codigo) !== digits));
  }

  return (
    <div className="w-full">
      <CnaePicker
        label={label}
        required={required}
        value={current}
        onChange={addItem}
        placeholder={placeholder}
        helperText={helperText}
        error={error}
        disabled={disabled}
      />

      {value.length > 0 && (
        <div className="mt-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Selecionados ({value.length})
            {maxItems !== undefined ? ` / ${maxItems}` : ""}
          </div>

          <div className="flex flex-col gap-2">
            {value.map((it) => {
              const digits = onlyDigits(it.codigo);
              return (
                <div
                  key={digits || it.codigo}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/60 px-3 py-2 shadow-sm transition dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {it.codigo}
                    </div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {it.descricao}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ml-3 rounded-xl border border-slate-200/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-400 dark:hover:text-rose-300"
                    onClick={() => removeItem(digits)}
                    disabled={disabled}
                  >
                    Remover
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
