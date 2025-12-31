import React, { useMemo, useState } from "react";
import AppTextInput from "./AppTextInput";
import AppSelectInput from "./AppSelectInput";
import { AnexoSimples, RegimeTributario } from "../../../features/tributacao/types";
import { formatBRLRangeClamp, formatPercentBR } from "../../../shared/utils/formater";
import { anexoSimplesOptions, regimeTributarioOptions } from "../../../shared/types/select-type";

export type TributacaoValue = {
    regimeTributario?: RegimeTributario;
    rbt12?: number;
    anexoSimples?: AnexoSimples;
    percentualFatorR?: number;
};

export type TributacaoErrors = Partial<Record<keyof TributacaoValue, string>>;

type Props = {
    value: TributacaoValue;
    onChange: (next: TributacaoValue) => void;
    errors?: TributacaoErrors;

    /**
     * MUITO IMPORTANTE:
     * quando você carregar outra empresa/tela e quiser que o display resete,
     * passe um valor que muda (ex: empresaId).
     */
    syncKey?: string | number;

    rbt12Max?: number;
};

export function AppTributacaoInput({
    value,
    onChange,
    errors = {},
    syncKey,
    rbt12Max = 4_800_000,
}: Props) {
    const regimeTributario = value.regimeTributario;
    const anexoSimples = value.anexoSimples;

    const showSimplesFields = regimeTributario === RegimeTributario.SIMPLES_NACIONAL;
    const showFatorR =
        !!anexoSimples && (anexoSimples === AnexoSimples.V || anexoSimples === AnexoSimples.III);

    // 🔒 Inicialização do display SEM useEffect.
    // Se quiser “ressincronizar” quando trocar de empresa, use `key={syncKey}` no wrapper.
    const initialRbt12Display = useMemo(() => {
        const raw = value.rbt12 !== undefined ? String(value.rbt12) : "";
        return raw ? formatBRLRangeClamp(raw, 0, rbt12Max) : "R$ 0,00";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncKey]); // só muda quando syncKey muda

    const initialFatorRDisplay = useMemo(() => {
        const raw = value.percentualFatorR !== undefined ? String(value.percentualFatorR) : "";
        return raw ? formatPercentBR(raw) : "0,00%";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncKey]); // só muda quando syncKey muda

    const [rbt12Display, setRbt12Display] = useState<string>(initialRbt12Display);
    const [percentualFatorRDisplay, setPercentualFatorRDisplay] = useState<string>(initialFatorRDisplay);

    function patch(next: Partial<TributacaoValue>) {
        onChange({ ...value, ...next });
    }

    return (
        <div className="flex w-full gap-4" key={syncKey}>
            <AppSelectInput
                value={regimeTributario ?? ""}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const next = e.target.value as RegimeTributario;

                    if (next !== RegimeTributario.SIMPLES_NACIONAL) {
                        onChange({
                            ...value,
                            regimeTributario: next,
                            rbt12: undefined,
                            anexoSimples: undefined,
                            percentualFatorR: undefined,
                        });
                        setRbt12Display("R$ 0,00");
                        setPercentualFatorRDisplay("0,00%");
                        return;
                    }

                    patch({ regimeTributario: next });
                    setRbt12Display("R$ 0,00");
                    setPercentualFatorRDisplay("0,00%");
                }}
                error={errors.regimeTributario}
                required
                title="Regime Tributário"
                data={regimeTributarioOptions}
            />

            {showSimplesFields && (
                <>
                    <AppTextInput
                        value={rbt12Display}
                        onChange={(e) => setRbt12Display(e.target.value)}
                        onValueChange={(raw) => patch({ rbt12: raw ? Number(raw) : undefined })}
                        error={errors.rbt12}
                        formatter={(v) => formatBRLRangeClamp(v, 0, rbt12Max)}
                        sanitizeRegex={/[0-9]/g}
                        required
                        title="RBT12"
                        tooltip="RBT12 = Receita Bruta Total acumulada dos últimos 12 meses."
                        placeholder=""
                    />

                    <AppSelectInput
                        value={anexoSimples ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const next = e.target.value as AnexoSimples;

                            if (next !== AnexoSimples.V && next !== AnexoSimples.III) {
                                onChange({
                                    ...value,
                                    anexoSimples: next,
                                    percentualFatorR: undefined,
                                });
                                setPercentualFatorRDisplay("0,00%");
                                return;
                            }

                            patch({ anexoSimples: next });
                            setPercentualFatorRDisplay("0,00%");
                        }}
                        required
                        error={errors.anexoSimples}
                        title="Anexo do Simples"
                        data={anexoSimplesOptions}
                    />
                </>
            )}

            {showFatorR && (
                <AppTextInput
                    tooltip="Fator R = Folha/Receita (12m). Corte 28%"
                    value={percentualFatorRDisplay}
                    onChange={(e) => setPercentualFatorRDisplay(e.target.value)}
                    onValueChange={(raw) => patch({ percentualFatorR: raw ? Number(raw) : undefined })}
                    error={errors.percentualFatorR}
                    formatter={formatPercentBR}
                    sanitizeRegex={/[0-9]/g}
                    required
                    title="Percentual Fator R"
                    placeholder=""
                />
            )}
        </div>
    );
}
