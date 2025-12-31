import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppHeader from "../../../components/layout/header/AppHeader";
import AppButton from "../../../components/ui/button/AppButton";
import { deleteConta, listContas } from "../storage/contas";
import type { ContaBancaria } from "../types";
import AppListNotFound from "../../../components/ui/AppListNotFound";

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
    setContas(listContas());
  }, []);

  const handleRemove = (conta: ContaBancaria) => {
    const confirmed = window.confirm(
      `Deseja remover a conta "${conta.nome}"?`
    );
    if (!confirmed) return;
    deleteConta(conta.id);
    setContas(listContas());
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
          {contas.length ? (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Conta</th>
                    <th className="px-4 py-3">Banco</th>
                    <th className="px-4 py-3">Agencia</th>
                    <th className="px-4 py-3">Numero</th>
                    <th className="px-4 py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contas.map((conta) => (
                    <tr key={conta.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {conta.nome}
                      </td>
                      <td className="px-4 py-3">{conta.banco}</td>
                      <td className="px-4 py-3">{conta.agencia}</td>
                      <td className="px-4 py-3">
                        {conta.conta}
                        {conta.digito ? `-${conta.digito}` : ""}
                      </td>
                      <td className="px-4 py-3 text-right">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AppListNotFound texto="Nenhuma conta cadastrada ainda." />
          )}
        </div>
      </Card>
    </div>
  );
};

export default ContasBancariasPage;
