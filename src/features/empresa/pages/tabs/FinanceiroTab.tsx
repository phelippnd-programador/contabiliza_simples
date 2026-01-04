import React, { useEffect, useState } from "react";
import AppTextInput from "../../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../../components/ui/input/AppSelectInput";
import AppButton from "../../../../components/ui/button/AppButton";
import Card from "../../../../components/ui/card/Card";
import AppTitle, { AppSubTitle } from "../../../../components/ui/text/AppTitle";

import { formatBRL, formatPercentBR } from "../../../../shared/utils/formater";
import {
  empresaFinanceiroSchema,
  type EmpresaFinanceiroFormData,
} from "../../validation/empresa.financeiro.schema";
import { TipoMovimentoCaixa, type CategoriaMovimento } from "../../../financeiro/types";
import { categoriaInssOptions, diasPagamentoOptions } from "../../../../shared/types/select-type";
import { listContas } from "../../../financeiro/services/contas.service";
import type { ContaBancaria } from "../../../financeiro/types";
import { listCategorias } from "../../../financeiro/services/categorias.service";

type Props = {
  onSave?: () => Promise<void> | void;
};


const formatTipoMovimento = (tipo: TipoMovimentoCaixa) =>
  tipo === TipoMovimentoCaixa.ENTRADA ? "Entrada" : "Saida";

export function FinanceiroTab({ onSave }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<EmpresaFinanceiroFormData>({
    temProlabore: false,
    gerarLancamentoInss: true,
    percentualInssProlabore: 11,
    frequenciaProlabore: "MENSAL",
  });
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const [contasData, categoriasData] = await Promise.all([
        listContas(),
        listCategorias(),
      ]);
      if (!isMounted) return;
      setContas(contasData);
      setCategorias(categoriasData);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const contaOptions = contas.map((conta) => ({
    value: conta.id,
    label: `${conta.nome} (${conta.banco})`,
  }));
  const categoriasSaidaOptions = categorias
    .filter((categoria) => categoria.tipo === TipoMovimentoCaixa.SAIDA)
    .map((categoria) => ({
      value: categoria.id,
      label: categoria.nome,
    }));

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
      <div className="mb-4">
        <AppTitle text="Financeiro" />
        <AppSubTitle text="Defina regras de pro-labore e encargos." />
      </div>

      <Card>
        <AppSubTitle text="Pro-labore" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Configure o pagamento mensal do socio e encargos relacionados.
        </p>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.temProlabore ?? false}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                temProlabore: e.target.checked,
              }))
            }
          />
          A empresa possui pro-labore
        </label>
      </Card>

      {form.temProlabore && (
        <>
          <Card>
            <AppSubTitle text="Dados do pagamento" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <AppTextInput
                required
                title="Valor do pro-labore"
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
                data={contaOptions}
                placeholder="Selecione"
                error={errors.contaPagamentoProlaboreId}
              />
            </div>

            <div className="mt-4">
              <AppSelectInput
                required
                title="Categoria do pro-labore"
                value={form.categoriaProlaboreId ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    categoriaProlaboreId: e.target.value,
                  }))
                }
                data={categoriasSaidaOptions}
                placeholder="Selecione"
                error={errors.categoriaProlaboreId}
              />
            </div>
          </Card>

          <Card>
            <AppSubTitle text="INSS" />

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
              Gerar lancamento automatico de INSS
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
                  data={categoriaInssOptions}
                  placeholder="Selecione"
                  error={errors.categoriaInssId}
                />
              </div>
            )}
          </Card>
        </>
      )}

      <div className="flex justify-end">
        <AppButton onClick={handleSave}>Salvar</AppButton>
      </div>
    </div>
  );
}
