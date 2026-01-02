import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import { listCategorias } from "../../financeiro/services/categorias.service";
import { listMovimentos } from "../../financeiro/services/movimentos.service";
import {
  TipoMovimentoCaixa,
  type CategoriaMovimento,
  type MovimentoCaixa,
} from "../../financeiro/types";

const getCompetencia = (movimento: MovimentoCaixa) => {
  if (movimento.competencia) return movimento.competencia;
  return movimento.data?.slice(0, 7) ?? "";
};

const addMonths = (base: string, offset: number) => {
  const [yearRaw, monthRaw] = base.split("-").map(Number);
  if (!yearRaw || !monthRaw) return base;
  const date = new Date(yearRaw, monthRaw - 1 + offset, 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const FechamentoFiscalPage = () => {
  const [competencia, setCompetencia] = useState("");
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const [movimentosData, categoriasData] = await Promise.all([
        listMovimentos(),
        listCategorias(),
      ]);
      if (!isMounted) return;
      setMovimentos(movimentosData);
      setCategorias(categoriasData);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const categoriasFolhaIds = useMemo(() => {
    return categorias
      .filter((categoria) => {
        const nome = categoria.nome.toLowerCase();
        return nome.includes("pro-labore") || nome.includes("inss");
      })
      .map((categoria) => categoria.id);
  }, [categorias]);

  const receitaMes = useMemo(() => {
    if (!competencia) return [];
    const entradas = movimentos.filter(
      (movimento) =>
        movimento.tipo === TipoMovimentoCaixa.ENTRADA &&
        getCompetencia(movimento) === competencia
    );
    const agrupado = new Map<string, number>();
    entradas.forEach((movimento) => {
      const cnae = movimento.cnae?.trim() || "Sem CNAE";
      const atual = agrupado.get(cnae) ?? 0;
      agrupado.set(cnae, atual + movimento.valor);
    });
    return Array.from(agrupado.entries()).map(([cnae, valor]) => ({
      cnae,
      valor,
    }));
  }, [competencia, movimentos]);

  const totalReceitaMes = receitaMes.reduce((acc, item) => acc + item.valor, 0);

  const rbt12 = useMemo(() => {
    if (!competencia) return 0;
    const months = Array.from({ length: 12 }, (_, i) => addMonths(competencia, -i));
    return movimentos
      .filter(
        (movimento) =>
          movimento.tipo === TipoMovimentoCaixa.ENTRADA &&
          months.includes(getCompetencia(movimento))
      )
      .reduce((acc, movimento) => acc + movimento.valor, 0);
  }, [competencia, movimentos]);

  const folha12 = useMemo(() => {
    if (!competencia) return 0;
    const months = Array.from({ length: 12 }, (_, i) => addMonths(competencia, -i));
    return movimentos
      .filter(
        (movimento) =>
          movimento.tipo === TipoMovimentoCaixa.SAIDA &&
          months.includes(getCompetencia(movimento)) &&
          movimento.categoriaId &&
          categoriasFolhaIds.includes(movimento.categoriaId)
      )
      .reduce((acc, movimento) => acc + movimento.valor, 0);
  }, [competencia, movimentos, categoriasFolhaIds]);

  const fatorR = rbt12 ? folha12 / rbt12 : 0;
  const fatorRPercent = (fatorR * 100).toFixed(2);
  const fatorRAnexo = fatorR >= 0.28 ? "Anexo III" : "Anexo V";

  return (
    <div className="flex w-full flex-col items-center justify-center p-5">
      <AppTitle text="Fechamento fiscal mensal" />
      <AppSubTitle text="Consolidacao de receita e verificacoes fiscais." />

      <Card>
        <AppSubTitle text="Competencia" />
        <small>Selecione a competencia para consolidar a receita.</small>

        <div className="mt-4 max-w-sm">
          <AppTextInput
            title="Competencia"
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Receita do mes</p>
            <p className="text-lg font-semibold">
              {totalReceitaMes.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">RBT12</p>
            <p className="text-lg font-semibold">
              {rbt12.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Fator R</p>
            <p className="text-lg font-semibold">{fatorRPercent}%</p>
            <p className="text-xs text-gray-500">{fatorRAnexo}</p>
          </div>
        </div>

        <div className="mt-6">
          <AppSubTitle text="Receita por CNAE" />
          <AppTable
            data={receitaMes}
            rowKey={(row) => row.cnae}
            emptyState={
              <AppListNotFound texto="Nenhuma receita encontrada." />
            }
            pagination={{ enabled: false }}
            columns={[
              { key: "cnae", header: "CNAE", render: (row) => row.cnae },
              {
                key: "valor",
                header: "Valor",
                align: "right",
                render: (row) =>
                  row.valor.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
};

export default FechamentoFiscalPage;
