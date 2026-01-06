import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppTable from "../../../components/ui/table/AppTable";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import {
  deleteCartao,
  listCartoes,
  type CartaoResumo,
} from "../services/cartoes.service";
import { resolveBankLabel, type BankItem, getBanksCached } from "../../../shared/services/banks";
import { formatLocalDate } from "../../../shared/utils/formater";

const CartoesPage = () => {
  const navigate = useNavigate();
  const { popupProps, openConfirm } = useConfirmPopup();
  const [cartoes, setCartoes] = useState<CartaoResumo[]>([]);
  const [banks, setBanks] = useState<BankItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const data = await listCartoes();
      if (!isMounted) return;
      setCartoes(data);
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

  const handleRemove = (cartao: CartaoResumo) => {
    openConfirm(
      {
        title: "Remover cartao",
        description: `Deseja remover o cartao "${cartao.nome}"?`,
        confirmLabel: "Remover",
        tone: "danger",
      },
      async () => {
        await deleteCartao(cartao.id);
        setCartoes(await listCartoes());
      }
    );
  };

  return (
    <div className="flex w-full flex-col items-center justify-center p-5">
      <AppTitle text="Cartoes" />
      <AppSubTitle text="Cadastre e acompanhe seus cartoes de credito." />

      <Card>
        <div className="flex items-center justify-between gap-4">
          <AppButton
            type="button"
            className="w-10"
            onClick={() => navigate("/financeiro/cartoes/novo")}
          >
            Novo cartao
          </AppButton>
        </div>

        <div className="mt-4">
          <AppTable
            data={cartoes}
            rowKey={(row) => row.id}
            emptyState={<AppListNotFound texto="Nenhum cartao cadastrado ainda." />}
            pagination={{ enabled: true, pageSize: 6 }}
            columns={[
              {
                key: "nome",
                header: "Cartao",
                render: (row) => (
                  <span className="font-medium text-gray-900 dark:text-gray-400">
                    {row.nome}
                  </span>
                ),
              },
              {
                key: "banco",
                header: "Banco",
                render: (row) => resolveBankLabel(row.banco, banks),
              },
              {
                key: "vencimento",
                header: "Vencimento",
                render: (row) =>
                  row.vencimentoDia ? `Dia ${row.vencimentoDia}` : "-",
              },
              {
                key: "fechamento",
                header: "Fechamento",
                render: (row) =>
                  row.fechamentoDia ? `Dia ${row.fechamentoDia}` : "-",
              },
              {
                key: "limiteInicial",
                header: "Limite inicial",
                align: "right" as const,
                render: (row) =>
                  (row.limiteInicial / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
              },
              {
                key: "acoes",
                header: "Acoes",
                align: "right",
                render: (row) => (
                  <div className="flex justify-end gap-2">
                    <AppIconButton
                      icon={<EditIcon className="h-4 w-4" />}
                      label={`Editar cartao ${row.nome}`}
                      onClick={() => navigate(`/financeiro/cartoes/${row.id}`)}
                    />
                    <AppIconButton
                      icon={<TrashIcon className="h-4 w-4" />}
                      label={`Remover cartao ${row.nome}`}
                      variant="danger"
                      onClick={() => handleRemove(row)}
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

export default CartoesPage;
