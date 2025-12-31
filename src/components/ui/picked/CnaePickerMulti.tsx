import React, { useMemo, useState } from "react";
import type { CnaeItem } from "../../../shared/services/ibgeCnae";
import { CnaePicker } from "./CnaePicker";

type Props = {
    label?: string;
    required?: boolean;

    /** lista de CNAEs selecionados */
    value: CnaeItem[];
    onChange: (items: CnaeItem[]) => void;

    /** opcional: se quiser guardar no form só números */
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
    label = "CNAEs Secundários",
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
            // opcional: apenas limpa o input
            setCurrent(null);
            return;
        }

        // limite opcional
        if (maxItems !== undefined && value.length >= maxItems) return;

        emit([...value, item]);
        setCurrent(null); // limpa pra adicionar outro
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
                <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                    <div className="mb-2 text-xs text-gray-500">
                        Selecionados ({value.length})
                        {maxItems !== undefined ? ` / ${maxItems}` : ""}
                    </div>

                    <div className="flex flex-col gap-2">
                        {value.map((it) => {
                            const digits = onlyDigits(it.codigo);
                            return (
                                <div
                                    key={digits || it.codigo}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <div className="font-medium">{it.codigo}</div>
                                        <div className="truncate text-xs text-gray-600">{it.descricao}</div>
                                    </div>

                                    <button
                                        type="button"
                                        className="ml-3 rounded-lg border border-gray-200 px-3 py-1 text-sm hover:border-red-400 hover:text-red-600"
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
