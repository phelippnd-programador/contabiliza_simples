import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import { deleteConta, listContas } from "../services/contas.service";
import type { ContaBancaria } from "../types";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppTable from "../../../components/ui/table/AppTable";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";
import {
  getBanksCached,
  resolveBankLabel,
  type BankItem,
} from "../../../shared/services/banks";

const ContasBancariasPage = () => {
  const navigate = useNavigate();
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [banks, setBanks] = useState<BankItem[]>([]);
  const { popupProps, openConfirm } = useConfirmPopup();

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

  useEffect(() => {
    let isMounted = true;
    const loadBanks = async () => {
      const data = await getBanksCached();
      if (!isMounted) return;
      setBanks(data);
    };
    loadBanks();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemove = (conta: ContaBancaria) => {
    openConfirm(
      {
        title: "Remover conta",
        description: `Deseja remover a conta "${conta.nome}"?`,
        confirmLabel: "Remover",
        tone: "danger",
      },
      async () => {
        await deleteConta(conta.id);
        setContas(await listContas());
      }
    );
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1">
        <AppTitle text="Contas bancarias" />
        <AppSubTitle text="Gerencie as contas cadastradas no financeiro." />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <AppButton
            type="button"
            className="w-auto px-6"
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
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {conta.nome}
                  </span>
                ),
              },
              {
                key: "banco",
                header: "Banco",
                render: (conta) => resolveBankLabel(conta.banco, banks),
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
                    <AppIconButton
                      icon={<EditIcon className="h-4 w-4" />}
                      label={`Editar conta ${conta.nome}`}
                      onClick={() => navigate(`/financeiro/contas/${conta.id}`)}
                    />
                    <AppIconButton
                      icon={<TrashIcon className="h-4 w-4" />}
                      label={`Remover conta ${conta.nome}`}
                      variant="danger"
                      onClick={() => handleRemove(conta)}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>
      <AppPopup {...popupProps} />
    </div>
  );
};

export default ContasBancariasPage;
