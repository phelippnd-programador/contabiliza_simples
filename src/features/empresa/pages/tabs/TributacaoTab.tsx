import React, { useMemo, useState } from "react";
import AppButton from "../../../../components/ui/button/AppButton";
import { AppTributacaoInput, type TributacaoErrors, type TributacaoValue } from "../../../../components/ui/input/AppTributacaoInput";
import { CnaePicker } from "../../../../components/ui/picked/CnaePicker";
import { CnaePickerMulti } from "../../../../components/ui/picked/CnaePickerMulti";

import type { CnaeItem } from "../../../../shared/services/ibgeCnae";
import { maskCnae } from "../../../../shared/services/ibgeCnae";

import type { EmpresaTributacaoFormData } from "../../validation/empresa.tributacao.schema";
import { empresaTributacaoSchema } from "../../validation/empresa.tributacao.schema";

type Props = {
    empresaId?: string | number;

    onSave?: () => Promise<void> | void;
};

function onlyDigits(v: string) {
    return (v || "").replace(/\D/g, "");
}

function zodToErrors(err: unknown): Record<string, string> {
    // sem "any": usa narrowing do Zod
    if (typeof err !== "object" || err === null) return {};
    const zerr = err as { issues?: Array<{ path: (string | number)[]; message: string }> };
    if (!Array.isArray(zerr.issues)) return {};

    const out: Record<string, string> = {};
    for (const issue of zerr.issues) {
        const key = issue.path?.[0];
        if (typeof key === "string") {
            // guarda a primeira mensagem por campo
            if (!out[key]) out[key] = issue.message;
        }
    }
    return out;
}

export function TributacaoTab({ empresaId, onSave }: Props) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form, setForm] = useState<EmpresaTributacaoFormData>({})
    // display local para CNAE principal (descrição)
    const [cnaePrincipalItem, setCnaePrincipalItem] = useState<CnaeItem | null>(null);

    // display local para CNAEs secundários (descrições)
    const [cnaesSecundariosItems, setCnaesSecundariosItems] = useState<CnaeItem[]>([]);

    // monta value de tributação
    const tributacaoValue: TributacaoValue = {
        regimeTributario: form.regimeTributario,
        rbt12: form.rbt12,
        anexoSimples: form.anexoSimples,
        percentualFatorR: form.percentualFatorR,
    };

    function setTributacao(next: TributacaoValue) {
        setForm((p) => ({
            ...p,
            regimeTributario: next.regimeTributario,
            rbt12: next.rbt12,
            anexoSimples: next.anexoSimples,
            percentualFatorR: next.percentualFatorR,
        }));
    }

    // fallback: se form tem só dígitos, exibe ao menos o código mascarado
    const cnaePrincipalValue = useMemo<CnaeItem | null>(() => {
        const digits = onlyDigits(String(form.cnaePrincipal ?? ""));
        if (!digits) return null;

        if (cnaePrincipalItem && onlyDigits(cnaePrincipalItem.codigo) === digits) {
            return cnaePrincipalItem;
        }

        return { codigo: maskCnae(digits), descricao: "" };
    }, [form.cnaePrincipal, cnaePrincipalItem]);

    function validateWithZod(): boolean {
        const res = empresaTributacaoSchema.safeParse(form);
        if (res.success) {
            setErrors({});
            return true;
        }
        setErrors(zodToErrors(res.error));
        return false;
    }

    async function handleSave() {
        if (!validateWithZod()) return;
        await onSave?.();
    }

    return (
        <div className="flex flex-col gap-6">
            {/* CNAE */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-4">
                    <h2 className="text-base font-semibold">Atividade (CNAE)</h2>
                    <p className="text-sm text-gray-500">
                        Defina o CNAE principal e os CNAEs secundários (se houver). Isso impacta regras fiscais.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {/* CNAE Principal */}
                    <CnaePicker
                        required
                        value={cnaePrincipalValue}
                        onChange={(item) => {
                            setCnaePrincipalItem(item);
                            setErrors((prev) => ({ ...prev, cnaePrincipal: "" }));
                        }}
                        onChangeCodigo={(digits) => {
                            setForm((p) => ({ ...p, cnaePrincipal: digits ?? "" }));
                        }}
                        error={errors.cnaePrincipal}
                        helperText="Busque pelo código (ex: 6201-5/01) ou descrição (ex: software)."
                    />

                    {/* CNAEs Secundários (multi) */}
                    <CnaePickerMulti
                        label="CNAEs secundários (opcional)"
                        value={cnaesSecundariosItems}
                        onChange={(items) => setCnaesSecundariosItems(items)}
                        onChangeCodigos={(digits) => {
                            setForm((p) => ({ ...p, cnaesSecundarios: digits.length ? digits : undefined }));
                            setErrors((prev) => ({ ...prev, cnaesSecundarios: "" }));
                        }}
                        helperText="Adicione CNAEs secundários conforme necessário. Duplicados são bloqueados."
                        error={errors.cnaesSecundarios}
                    />
                </div>
            </div>

            {/* TRIBUTAÇÃO */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-4">
                    <h2 className="text-base font-semibold">Tributação</h2>
                    <p className="text-sm text-gray-500">
                        Informe o regime e, se Simples Nacional, preencha os campos obrigatórios.
                    </p>
                </div>

                <AppTributacaoInput
                    syncKey={empresaId ?? "novo"}
                    value={tributacaoValue}
                    onChange={setTributacao}
                    errors={errors as unknown as TributacaoErrors}
                    rbt12Max={4_800_000}
                />
            </div>

            {/* AÇÕES */}
            <div className="flex items-center justify-end gap-3">
                <AppButton onClick={handleSave}>Salvar</AppButton>
            </div>
        </div>
    );
}
