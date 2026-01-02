import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import { listContas } from "../services/contas.service";
import { listCategorias } from "../services/categorias.service";
import { saveMovimento } from "../services/movimentos.service";
import {
  TipoMovimentoCaixa,
  type CategoriaMovimento,
  type ContaBancaria,
} from "../types";
import { formatBRL, formatPercentBR } from "../../../shared/utils/formater";

const ProlaborePage = () => {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);
  const [form, setForm] = useState({
    competencia: "",
    data: "",
    contaId: "",
    categoriaProlaboreId: "",
    categoriaInssId: "",
    valorProlabore: 0,
    percentualInss: 11,
    gerarInss: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const contaOptions = useMemo(
    () =>
      contas.map((conta) => ({
        value: conta.id,
        label: `${conta.nome} (${conta.banco})`,
      })),
    [contas]
  );

  const categoriasSaida = useMemo(
    () => categorias.filter((categoria) => categoria.tipo === TipoMovimentoCaixa.SAIDA),
    [categorias]
  );

  const categoriaOptions = useMemo(
    () =>
      categoriasSaida.map((categoria) => ({
        value: categoria.id,
        label: categoria.nome,
      })),
    [categoriasSaida]
  );

  const handleGerar = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.data) nextErrors.data = "Informe a data";
    if (!form.contaId) nextErrors.contaId = "Selecione a conta";
    if (!form.categoriaProlaboreId) {
      nextErrors.categoriaProlaboreId = "Selecione a categoria do pro-labore";
    }
    if (form.gerarInss && !form.categoriaInssId) {
      nextErrors.categoriaInssId = "Selecione a categoria do INSS";
    }
    if (!form.valorProlabore || form.valorProlabore <= 0) {
      nextErrors.valorProlabore = "Informe o valor";
    }
    if (form.gerarInss && (!form.percentualInss || form.percentualInss <= 0)) {
      nextErrors.percentualInss = "Informe o percentual";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    await saveMovimento({
      data: form.data,
      contaId: form.contaId,
      tipo: TipoMovimentoCaixa.SAIDA,
      valor: form.valorProlabore,
      descricao: "Pro-labore",
      competencia: form.competencia || undefined,
      categoriaId: form.categoriaProlaboreId,
    });

    if (form.gerarInss) {
      const valorInss = (form.valorProlabore * form.percentualInss) / 100;
      await saveMovimento({
        data: form.data,
        contaId: form.contaId,
        tipo: TipoMovimentoCaixa.SAIDA,
        valor: valorInss,
        descricao: "INSS",
        competencia: form.competencia || undefined,
        categoriaId: form.categoriaInssId,
      });
    }

    setErrors({});
    setForm((prev) => ({ ...prev, valorProlabore: 0 }));
  };

  return (
    <div className="flex w-full flex-col items-center justify-center p-5">
      <AppTitle text="Pro-labore (execucao)" />
      <AppSubTitle text="Gere lancamentos automaticos de pro-labore e INSS." />

      <Card>
        <AppSubTitle text="Dados do lancamento" />
        <small>Baseado na configuracao da empresa.</small>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppDateInput
            title="Competencia"
            type="month"
            value={form.competencia}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, competencia: e.target.value }))
            }
          />

          <AppDateInput
            required
            title="Data"
            type="date"
            value={form.data}
            onChange={(e) => setForm((prev) => ({ ...prev, data: e.target.value }))}
            error={errors.data}
          />

          <AppSelectInput
            required
            title="Conta"
            value={form.contaId}
            onChange={(e) => setForm((prev) => ({ ...prev, contaId: e.target.value }))}
            data={contaOptions}
            placeholder="Selecione"
            error={errors.contaId}
          />

          <AppTextInput
            required
            title="Valor pro-labore"
            value={form.valorProlabore ? String(form.valorProlabore) : ""}
            onValueChange={(raw) =>
              setForm((prev) => ({ ...prev, valorProlabore: raw ? Number(raw) : 0 }))
            }
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            error={errors.valorProlabore}
          />

          <AppSelectInput
            required
            title="Categoria pro-labore"
            value={form.categoriaProlaboreId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, categoriaProlaboreId: e.target.value }))
            }
            data={categoriaOptions}
            placeholder="Selecione"
            error={errors.categoriaProlaboreId}
          />

          <div className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.gerarInss}
              onChange={(e) => setForm((prev) => ({ ...prev, gerarInss: e.target.checked }))}
            />
            Gerar INSS automaticamente
          </div>

          {form.gerarInss ? (
            <>
              <AppTextInput
                required
                title="Percentual INSS"
                value={form.percentualInss ? String(form.percentualInss) : ""}
                onValueChange={(raw) =>
                  setForm((prev) => ({ ...prev, percentualInss: raw ? Number(raw) : 0 }))
                }
                sanitizeRegex={/[0-9]/g}
                formatter={formatPercentBR}
                error={errors.percentualInss}
              />

              <AppSelectInput
                required
                title="Categoria INSS"
                value={form.categoriaInssId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, categoriaInssId: e.target.value }))
                }
                data={categoriaOptions}
                placeholder="Selecione"
                error={errors.categoriaInssId}
              />
            </>
          ) : null}
        </div>

        <div className="mt-6">
          <AppButton type="button" className="w-auto" onClick={handleGerar}>
            Gerar lancamentos
          </AppButton>
        </div>
      </Card>
    </div>
  );
};

export default ProlaborePage;
