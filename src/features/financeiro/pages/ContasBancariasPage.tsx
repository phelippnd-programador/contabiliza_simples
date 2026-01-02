import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import { deleteConta, listContas } from "../services/contas.service";
import type { ContaBancaria } from "../types";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppTable from "../../../components/ui/table/AppTable";

const EditIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M13.586 2.586a2 2 0 0 1 2.828 2.828l-9.5 9.5a1 1 0 0 1-.39.242l-4 1.333a.5.5 0 0 1-.632-.632l1.333-4a1 1 0 0 1 .242-.39l9.5-9.5Z" />
  </svg>
);

const ContasBancariasPage = () => {
  const navigate = useNavigate();
  const [contas, setContas] = useState<ContaBancaria[]>([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const data = await listContas();
      if (!isMounted) return;
      setContas(data);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemove = async (conta: ContaBancaria) => {
    const confirmed = window.confirm(
      `Deseja remover a conta "${conta.nome}"?`
    );
    if (!confirmed) return;
    await deleteConta(conta.id);
    setContas(await listContas());
  };

  return (
    <div className="flex w-full flex-col items-center justify-center p-5">
      <AppTitle text="Contas bancarias" />
      <AppSubTitle text="Gerencie as contas cadastradas no financeiro." />

      <Card>
        <div className="flex items-center justify-between gap-4">
          <AppButton
            type="button"
            className="w-10"
            onClick={() => navigate("/financeiro/contas/nova")}
          >
            Nova conta
          </AppButton>
        </div>

        <div className="mt-4">
          <AppTable
            data={contas}
            rowKey={(row) => row.id}
            emptyState={<AppListNotFound texto="Nenhuma conta cadastrada ainda." />}
            pagination={{ enabled: true, pageSize: 5 }}
            columns={[
              {
                key: "conta",
                header: "Conta",
                render: (conta) => (
                  <span className="font-medium text-gray-900">
                    {conta.nome}
                  </span>
                ),
              },
              {
                key: "banco",
                header: "Banco",
                render: (conta) => conta.banco,
              },
              {
                key: "agencia",
                header: "Agencia",
                render: (conta) => conta.agencia,
              },
              {
                key: "numero",
                header: "Numero",
                render: (conta) =>
                  `${conta.conta}${conta.digito ? `-${conta.digito}` : ""}`,
              },
              {
                key: "acoes",
                header: "Acoes",
                align: "right",
                render: (conta) => (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-blue-500"
                      onClick={() =>
                        navigate(`/financeiro/contas/${conta.id}`)
                      }
                      aria-label={`Editar conta ${conta.nome}`}
                    >
                      <EditIcon />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:border-red-400"
                      onClick={() => handleRemove(conta)}
                      aria-label={`Remover conta ${conta.nome}`}
                    >
                      Remover
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
};

export default ContasBancariasPage;
