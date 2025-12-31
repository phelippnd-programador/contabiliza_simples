import React, { useState } from "react";
import AppTextInput from "../../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../../components/ui/input/AppSelectInput";
import AppButton from "../../../../components/ui/button/AppButton";

import { formatBRL, formatPercentBR } from "../../../../shared/utils/formater";
import {
  empresaFinanceiroSchema,
  type EmpresaFinanceiroFormData,
} from "../../validation/empresa.financeiro.schema";
import {
  TipoConta,
  TipoMovimentoCaixa,
  type CategoriaMovimento,
  type ContaCaixa,
} from "../../../financeiro/types";
import { diasPagamentoOptions, tipoCategoriaOptions, tipoContaOptions } from "../../../../shared/types/select-type";

type Props = {
  onSave?: () => Promise<void> | void;
};


// const tipoCategoriaOptions = [
//   { value: TipoMovimentoCaixa.ENTRADA, label: "Entrada" },
//   { value: TipoMovimentoCaixa.SAIDA, label: "Saida" },
// ];

const formatTipoConta = (tipo: TipoConta) => {
  switch (tipo) {
    case TipoConta.BANCO:
      return "Banco";
    case TipoConta.DINHEIRO:
      return "Dinheiro";
    case TipoConta.CARTAO:
      return "Cartao";
    default:
      return "Outros";
  }
};

const formatTipoMovimento = (tipo: TipoMovimentoCaixa) =>
  tipo === TipoMovimentoCaixa.ENTRADA ? "Entrada" : "Saida";

const createLocalId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function FinanceiroTab({ onSave }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<EmpresaFinanceiroFormData>({
    temProlabore: false,
    gerarLancamentoInss: true,
    percentualInssProlabore: 11,
    frequenciaProlabore: "MENSAL",
  });
  const [contas, setContas] = useState<ContaCaixa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);
  const [novaConta, setNovaConta] = useState<{
    nome: string;
    tipo: TipoConta;
  }>({
    nome: "",
    tipo: TipoConta.BANCO,
  });
  const [novaCategoria, setNovaCategoria] = useState<{
    nome: string;
    tipo: TipoMovimentoCaixa;
  }>({
    nome: "",
    tipo: TipoMovimentoCaixa.SAIDA,
  });
  const [localErrors, setLocalErrors] = useState<{
    contaNome?: string;
    categoriaNome?: string;
  }>({});
  const [contaInputKey, setContaInputKey] = useState(0);
  const [categoriaInputKey, setCategoriaInputKey] = useState(0);

  const contaOptions = contas.map((conta) => ({
    value: conta.id,
    label: `${conta.nome} (${formatTipoConta(conta.tipo)})`,
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

  function handleAddConta() {
    const nome = novaConta.nome.trim();
    if (!nome) {
      setLocalErrors((prev) => ({
        ...prev,
        contaNome: "Informe o nome da conta",
      }));
      return;
    }

    setLocalErrors((prev) => ({ ...prev, contaNome: "" }));
    setContas((prev) => [
      ...prev,
      { id: createLocalId("conta"), nome, tipo: novaConta.tipo },
    ]);
    setNovaConta((prev) => ({ ...prev, nome: "" }));
    setContaInputKey((prev) => prev + 1);
  }

  function handleAddCategoria() {
    const nome = novaCategoria.nome.trim();
    if (!nome) {
      setLocalErrors((prev) => ({
        ...prev,
        categoriaNome: "Informe o nome da categoria",
      }));
      return;
    }

    setLocalErrors((prev) => ({ ...prev, categoriaNome: "" }));
    setCategorias((prev) => [
      ...prev,
      { id: createLocalId("categoria"), nome, tipo: novaCategoria.tipo },
    ]);
    setNovaCategoria((prev) => ({ ...prev, nome: "" }));
    setCategoriaInputKey((prev) => prev + 1);
  }

  async function handleSave() {
    if (!validate()) return;
    await onSave?.();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* CONTAS FINANCEIRAS */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Contas financeiras</h2>
          <p className="text-sm text-gray-500">
            Cadastre contas para usar nos lancamentos e pagamentos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppTextInput
            key={`conta-${contaInputKey}`}
            title="Nome da conta"
            value={novaConta.nome}
            onChange={(e) =>
              setNovaConta((prev) => ({ ...prev, nome: e.target.value }))
            }
            error={localErrors.contaNome}
          />

          <AppSelectInput
            title="Tipo"
            value={novaConta.tipo}
            onChange={(e) =>
              setNovaConta((prev) => ({
                ...prev,
                tipo: e.target.value as TipoConta,
              }))
            }
            data={tipoContaOptions}
          />

          <div className="flex items-end">
            <AppButton type="button" className="w-auto" onClick={handleAddConta}>
              Adicionar conta
            </AppButton>
          </div>
        </div>

        <div className="mt-4">
          {contas.length ? (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {contas.map((conta) => (
                <li
                  key={conta.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="font-medium text-gray-900">{conta.nome}</span>
                  <span className="text-xs text-gray-500">
                    {formatTipoConta(conta.tipo)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma conta cadastrada.</p>
          )}
        </div>
      </div>

      {/* CATEGORIAS DE LANCAMENTO */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Categorias de lancamento</h2>
          <p className="text-sm text-gray-500">
            Crie categorias de entrada e saida para organizar os movimentos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppTextInput
            key={`categoria-${categoriaInputKey}`}
            title="Nome da categoria"
            value={novaCategoria.nome}
            onChange={(e) =>
              setNovaCategoria((prev) => ({ ...prev, nome: e.target.value }))
            }
            error={localErrors.categoriaNome}
          />

          <AppSelectInput
            title="Tipo"
            value={novaCategoria.tipo}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const next = e.target.value as TipoMovimentoCaixa;
                setNovaCategoria((prev) => ({ ...prev, tipo: next }));
            }}
            // onChange={(e) =>
            //   setNovaCategoria((prev) => ({
            //     ...prev,
            //     tipo: e.target.value as TipoMovimentoCaixa,
            //   }))
            // }
            data={tipoCategoriaOptions}
          />

          <div className="flex items-end">
            <AppButton
              type="button"
              className="w-auto"
              onClick={handleAddCategoria}
            >
              Adicionar categoria
            </AppButton>
          </div>
        </div>

        <div className="mt-4">
          {categorias.length ? (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {categorias.map((categoria) => (
                <li
                  key={categoria.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="font-medium text-gray-900">
                    {categoria.nome}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTipoMovimento(categoria.tipo)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              Nenhuma categoria cadastrada.
            </p>
          )}
        </div>
      </div>

      {/* ATIVAR PRO-LABORE */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Pro-labore</h2>
          <p className="text-sm text-gray-500">
            Configure o pagamento mensal do socio e encargos relacionados.
          </p>
        </div>

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
      </div>

      {/* CONFIGURACOES */}
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
                  data={categoriasSaidaOptions}
                  placeholder="Selecione"
                  error={errors.categoriaInssId}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* ACOES */}
      <div className="flex justify-end">
        <AppButton onClick={handleSave}>Salvar</AppButton>
      </div>
    </div>
  );
}
