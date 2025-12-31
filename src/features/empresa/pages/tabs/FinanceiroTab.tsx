import React, { useState } from "react";
import AppTextInput from "../../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../../components/ui/input/AppSelectInput";
import AppButton from "../../../../components/ui/button/AppButton";


import { formatBRL, formatPercentBR } from "../../../../shared/utils/formater";
import { empresaFinanceiroSchema, type EmpresaFinanceiroFormData } from "../../validation/empresa.financeiro.schema";

type Props = {
 
  onSave?: () => Promise<void> | void;
};

const diasPagamentoOptions = Array.from({ length: 28 }, (_, i) => ({
  label: String(i + 1),
  value: i + 1,
}));

export function FinanceiroTab({ onSave }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<EmpresaFinanceiroFormData>({} as EmpresaFinanceiroFormData);

  function validate(): boolean {
    const res = empresaFinanceiroSchema.safeParse(form);
    if (res.success) {
      setErrors({});
      return true;
    }

    const next: Record<string, string> = {};
    res.error.issues.forEach((i) => {
      const key = i.path?.[0];
      if (typeof key === "string" && !next[key]) {
        next[key] = i.message;
      }
    });
    setErrors(next);
    return false;
  }

  async function handleSave() {
    if (!validate()) return;
    await onSave?.();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ATIVAR PRÓ-LABORE */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Pró-labore</h2>
          <p className="text-sm text-gray-500">
            Configure o pagamento mensal do sócio e encargos relacionados.
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.temProlabore}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                temProlabore: e.target.checked,
              }))
            }
          />
          A empresa possui pró-labore
        </label>
      </div>

      {/* CONFIGURAÇÕES */}
      {form.temProlabore && (
        <>
          {/* DADOS PRINCIPAIS */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">Dados do pagamento</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <AppTextInput
                required
                title="Valor do pró-labore"
                value={form.valorProlabore?.toString() ?? ""}
                onValueChange={(raw) =>
                  setForm((p) => ({
                    ...p,
                    valorProlabore: raw ? Number(raw) : undefined,
                  }))
                }
                formatter={formatBRL}
                sanitizeRegex={/[0-9]/g}
                error={errors.valorProlabore}
              />

              <AppSelectInput
                required
                title="Dia de pagamento"
                value={form.diaPagamentoProlabore ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    diaPagamentoProlabore: Number(e.target.value),
                  }))
                }
                data={diasPagamentoOptions}
                error={errors.diaPagamentoProlabore}
              />

              <AppSelectInput
                required
                title="Conta de pagamento"
                value={form.contaPagamentoProlaboreId ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    contaPagamentoProlaboreId: e.target.value,
                  }))
                }
                data={[]} // 🔴 buscar contas financeiras
                error={errors.contaPagamentoProlaboreId}
              />
            </div>

            <div className="mt-4">
              <AppSelectInput
                required
                title="Categoria do pró-labore"
                value={form.categoriaProlaboreId ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    categoriaProlaboreId: e.target.value,
                  }))
                }
                data={[]} // 🔴 buscar categorias de DESPESA
                error={errors.categoriaProlaboreId}
              />
            </div>
          </div>

          {/* INSS */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">INSS</h3>
            </div>

            <label className="mb-4 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.gerarLancamentoInss ?? true}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    gerarLancamentoInss: e.target.checked,
                  }))
                }
              />
              Gerar lançamento automático de INSS
            </label>

            {form.gerarLancamentoInss !== false && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <AppTextInput
                  required
                  title="Percentual do INSS"
                  value={form.percentualInssProlabore?.toString() ?? ""}
                  onValueChange={(raw) =>
                    setForm((p) => ({
                      ...p,
                      percentualInssProlabore: raw ? Number(raw) : undefined,
                    }))
                  }
                  formatter={formatPercentBR}
                  sanitizeRegex={/[0-9]/g}
                  error={errors.percentualInssProlabore}
                />

                <AppSelectInput
                  required
                  title="Categoria do INSS"
                  value={form.categoriaInssId ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      categoriaInssId: e.target.value,
                    }))
                  }
                  data={[]} // 🔴 buscar categorias de DESPESA
                  error={errors.categoriaInssId}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* AÇÕES */}
      <div className="flex justify-end">
        <AppButton onClick={handleSave}>Salvar</AppButton>
      </div>
    </div>
  );
}
