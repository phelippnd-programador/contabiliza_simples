import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import { listContas } from "../storage/contas";
import { listCategorias } from "../storage/categorias";
import { listMovimentos } from "../storage/movimentos";
import {
  TipoMovimentoCaixa,
  type CategoriaMovimento,
  type ContaBancaria,
  type MovimentoCaixa,
} from "../types";

const CaixaPage = () => {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [filters, setFilters] = useState({
    dataInicial: "",
    dataFinal: "",
    contaId: "",
    categoriaId: "",
  });

  useEffect(() => {
    setContas(listContas());
    setCategorias(listCategorias());
    setMovimentos(listMovimentos());
  }, []);

  const contaOptions = useMemo(
    () =>
      contas.map((conta) => ({
        value: conta.id,
        label: `${conta.nome} (${conta.banco})`,
      })),
    [contas]
  );

  const categoriaOptions = useMemo(
    () =>
      categorias.map((categoria) => ({
        value: categoria.id,
        label: categoria.nome,
      })),
    [categorias]
  );

  const filteredMovimentos = useMemo(() => {
    return movimentos.filter((movimento) => {
      if (filters.contaId && movimento.contaId !== filters.contaId) {
        return false;
      }
      if (filters.categoriaId && movimento.categoriaId !== filters.categoriaId) {
        return false;
      }
      if (filters.dataInicial && movimento.data < filters.dataInicial) {
        return false;
      }
      if (filters.dataFinal && movimento.data > filters.dataFinal) {
        return false;
      }
      return true;
    });
  }, [filters, movimentos]);

  const saldosPorConta = useMemo(() => {
    const base = new Map<string, number>();
    contas.forEach((conta) => base.set(conta.id, 0));

    filteredMovimentos.forEach((movimento) => {
      const atual = base.get(movimento.contaId) ?? 0;
      const sinal =
        movimento.tipo === TipoMovimentoCaixa.ENTRADA ? 1 : -1;
      base.set(movimento.contaId, atual + movimento.valor * sinal);
    });

    return contas.map((conta) => ({
      id: conta.id,
      conta,
      saldo: base.get(conta.id) ?? 0,
    }));
  }, [contas, filteredMovimentos]);

  const handleClearFilters = () => {
    setFilters({ dataInicial: "", dataFinal: "", contaId: "", categoriaId: "" });
  };

  return (
    <div className="flex w-full flex-col items-center justify-center p-5">
      <AppTitle text="Visao de caixa" />
      <AppSubTitle text="Acompanhe o saldo e o extrato por conta." />

      <Card>
        <AppSubTitle text="Filtros" />
        <small>Filtre os movimentos por periodo, conta e categoria.</small>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <AppTextInput
            title="Data inicial"
            type="date"
            value={filters.dataInicial}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dataInicial: e.target.value }))
            }
          />

          <AppTextInput
            title="Data final"
            type="date"
            value={filters.dataFinal}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dataFinal: e.target.value }))
            }
          />

          <AppSelectInput
            title="Conta"
            value={filters.contaId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, contaId: e.target.value }))
            }
            data={contaOptions}
            placeholder="Todas"
          />

          <AppSelectInput
            title="Categoria"
            value={filters.categoriaId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, categoriaId: e.target.value }))
            }
            data={categoriaOptions}
            placeholder="Todas"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <AppButton type="button" className="w-auto" onClick={handleClearFilters}>
            Limpar filtros
          </AppButton>
        </div>

        <div className="mt-6">
          <AppSubTitle text="Saldo por conta" />
          <AppTable
            data={saldosPorConta}
            rowKey={(row) => row.id}
            emptyState={<AppListNotFound texto="Nenhuma conta cadastrada." />}
            pagination={{ enabled: false }}
            columns={[
              {
                key: "conta",
                header: "Conta",
                render: (row) => (
                  <span className="font-medium text-gray-900">
                    {row.conta.nome}
                  </span>
                ),
              },
              {
                key: "banco",
                header: "Banco",
                render: (row) => row.conta.banco,
              },
              {
                key: "saldo",
                header: "Saldo",
                align: "right",
                render: (row) =>
                  row.saldo.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
              },
            ]}
          />
        </div>

        <div className="mt-6">
          <AppSubTitle text="Movimentos" />
          <AppTable
            data={filteredMovimentos}
            rowKey={(row) => row.id}
            emptyState={
              <AppListNotFound texto="Nenhum movimento encontrado." />
            }
            pagination={{ enabled: true, pageSize: 10 }}
            columns={[
              {
                key: "data",
                header: "Data",
                render: (movimento) => movimento.data,
              },
              {
                key: "conta",
                header: "Conta",
                render: (movimento) =>
                  contaOptions.find((conta) => conta.value === movimento.contaId)
                    ?.label ?? "Conta removida",
              },
              {
                key: "tipo",
                header: "Tipo",
                render: (movimento) =>
                  movimento.tipo === TipoMovimentoCaixa.ENTRADA
                    ? "Entrada"
                    : "Saida",
              },
              {
                key: "valor",
                header: "Valor",
                align: "right",
                render: (movimento) =>
                  movimento.valor.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
              },
              {
                key: "categoria",
                header: "Categoria",
                render: (movimento) =>
                  categoriaOptions.find(
                    (categoria) => categoria.value === movimento.categoriaId
                  )?.label ?? "Categoria removida",
              },
              {
                key: "descricao",
                header: "Descricao",
                render: (movimento) => movimento.descricao ?? "-",
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
};

export default CaixaPage;
