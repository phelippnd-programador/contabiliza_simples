import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import type { EmpresaResumo } from "../types";
import { listEmpresas } from "../services/empresas.service";

const EmpresasPage = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<EmpresaResumo[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setError("");
      const response = await listEmpresas({ page, pageSize });
      setEmpresas(response.data);
      setTotal(response.meta.total);
    } catch {
      setEmpresas([]);
      setError("Nao foi possivel carregar as empresas.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const columns = useMemo(
    () => [
      {
        key: "razaoSocial",
        header: "Razao social",
        render: (row: EmpresaResumo) => row.razaoSocial,
      },
      {
        key: "nomeFantasia",
        header: "Nome fantasia",
        render: (row: EmpresaResumo) => row.nomeFantasia ?? "-",
      },
      {
        key: "cnpj",
        header: "CNPJ",
        render: (row: EmpresaResumo) => row.cnpj ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: EmpresaResumo) => (
          <AppButton
            type="button"
            className="w-auto px-4"
            onClick={() => navigate(`/empresa/${row.id}`)}
          >
            Configurar
          </AppButton>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Empresas" />
          <AppSubTitle text="Gerencie os cadastros das empresas." />
        </div>
        <AppButton
          type="button"
          className="w-auto px-6"
          onClick={() => navigate("/empresa/nova")}
        >
          Cadastrar empresa
        </AppButton>
      </div>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={empresas}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma empresa cadastrada." />}
          pagination={{
            enabled: true,
            pageSize,
            page,
            total,
            onPageChange: setPage,
          }}
          columns={columns}
        />
      </Card>
    </div>
  );
};

export default EmpresasPage;
