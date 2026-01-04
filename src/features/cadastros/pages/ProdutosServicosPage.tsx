import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import { CnaePicker } from "../../../components/ui/picked/CnaePicker";
import { NcmPicker } from "../../../components/ui/picked/NcmPicker";
import type { CnaeItem } from "../../../shared/services/ibgeCnae";
import type { NcmItem } from "../../../shared/services/ncm";
import {
  listProdutosServicos,
  createProdutoServico,
  updateProdutoServico,
  deleteProdutoServico,
  type ProdutoServicoResumo,
} from "../services/cadastros.service";
import { formatBRL } from "../../../shared/utils/formater";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const tipoOptions = [
  { value: "PRODUTO", label: "Produto" },
  { value: "SERVICO", label: "Servico" },
];

const statusOptions = [
  { value: "ATIVO", label: "Ativo" },
  { value: "INATIVO", label: "Inativo" },
];

const ProdutosServicosPage = () => {
  const [itens, setItens] = useState<ProdutoServicoResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    descricao: "",
    tipo: "PRODUTO",
    status: "ATIVO",
    codigo: "",
    unidade: "",
    valorUnitarioCents: 0,
    ncm: "",
    cfop: "",
    cnae: "",
    codigoServico: "",
  });
  const [cnaeSelection, setCnaeSelection] = useState<CnaeItem | null>(null);
  const [ncmSelection, setNcmSelection] = useState<NcmItem | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setError("");
      const response = await listProdutosServicos({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar os produtos e servicos.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const columns = useMemo(
    () => [
      {
        key: "descricao",
        header: "Produto/Servico",
        render: (row: ProdutoServicoResumo) => row.descricao,
      },
      {
        key: "tipo",
        header: "Tipo",
        render: (row: ProdutoServicoResumo) => row.tipo ?? "-",
      },
      {
        key: "unidade",
        header: "Unidade",
        render: (row: ProdutoServicoResumo) => row.unidade ?? "-",
      },
      {
        key: "valor",
        header: "Valor",
        align: "right" as const,
        render: (row: ProdutoServicoResumo) =>
          typeof row.valorUnitario === "number"
            ? (row.valorUnitario / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : "-",
      },
      {
        key: "status",
        header: "Status",
        render: (row: ProdutoServicoResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: ProdutoServicoResumo) => (
          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  descricao: row.descricao,
                  tipo: row.tipo ?? "PRODUTO",
                  status: row.status ?? "ATIVO",
                  codigo: row.codigo ?? "",
                  unidade: row.unidade ?? "",
                  valorUnitarioCents: row.valorUnitario ?? 0,
                  ncm: row.ncm ?? "",
                  cfop: row.cfop ?? "",
                  cnae: row.cnae ?? "",
                  codigoServico: row.codigoServico ?? "",
                });
                setCnaeSelection(
                  row.cnae ? { codigo: row.cnae, descricao: "" } : null
                );
                setNcmSelection(
                  row.ncm ? { codigo: row.ncm, descricao: "" } : null
                );
                setFormError("");
                setFormOpen(true);
              }}
            >
              Editar
            </AppButton>
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={async () => {
                if (!API_BASE) {
                  setError("API nao configurada.");
                  return;
                }
                const confirmed = window.confirm("Excluir este item?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteProdutoServico(row.id);
                  load();
                } catch {
                  setError("Nao foi possivel excluir o item.");
                }
              }}
            >
              Excluir
            </AppButton>
          </div>
        ),
      },
    ],
    []
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      descricao: "",
      tipo: "PRODUTO",
      status: "ATIVO",
      codigo: "",
      unidade: "",
      valorUnitarioCents: 0,
      ncm: "",
      cfop: "",
      cnae: "",
      codigoServico: "",
    });
    setCnaeSelection(null);
    setNcmSelection(null);
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.descricao || !formData.unidade || formData.valorUnitarioCents <= 0) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (formData.tipo === "PRODUTO" && (!formData.ncm || !formData.cfop)) {
      setFormError("Informe NCM e CFOP para produto.");
      return;
    }
    if (formData.tipo === "SERVICO" && !formData.cnae) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      const payload = {
        descricao: formData.descricao,
        tipo: formData.tipo,
        status: formData.status,
        codigo: formData.codigo || undefined,
        unidade: formData.unidade,
        valorUnitario: formData.valorUnitarioCents,
        ncm: formData.ncm || undefined,
        cfop: formData.cfop || undefined,
        cnae: formData.cnae || undefined,
        codigoServico: formData.codigoServico || undefined,
      };
      if (editingId) {
        await updateProdutoServico(editingId, payload);
      } else {
        await createProdutoServico(payload);
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar o item.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Produtos e servicos" />
          <AppSubTitle text="Cadastro de itens vendidos e prestados." />
        </div>
        <AppButton
          type="button"
          className="w-auto px-6"
          onClick={() => {
            resetForm();
            setFormError("");
            setFormOpen((prev) => !prev);
          }}
        >
          {formOpen ? "Fechar" : "Novo item"}
        </AppButton>
      </div>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <AppTextInput
              required
              title="Descricao"
              value={formData.descricao}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, descricao: e.target.value }))
              }
            />
            <AppTextInput
              title="Codigo interno"
              value={formData.codigo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, codigo: e.target.value }))
              }
            />
            <AppSelectInput
              title="Tipo"
              value={formData.tipo}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  tipo: e.target.value,
                  ncm: "",
                  cnae: "",
                  cfop: "",
                }));
                setCnaeSelection(null);
                setNcmSelection(null);
              }}
              data={tipoOptions}
            />
            <AppTextInput
              required
              title="Unidade"
              value={formData.unidade}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, unidade: e.target.value }))
              }
            />
            <AppTextInput
              required
              title="Valor unitario"
              value={formData.valorUnitarioCents ? String(formData.valorUnitarioCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  valorUnitarioCents: Number(raw || "0"),
                }))
              }
            />
            {formData.tipo === "PRODUTO" ? (
              <>
                <NcmPicker
                  required
                  label="NCM"
                  value={ncmSelection}
                  onChange={(selection) => setNcmSelection(selection)}
                  onChangeCodigo={(codigo) =>
                    setFormData((prev) => ({ ...prev, ncm: codigo ?? "" }))
                  }
                  helperText="Selecione o NCM do produto."
                />
                <AppTextInput
                  required
                  title="CFOP"
                  value={formData.cfop}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cfop: e.target.value }))
                  }
                />
              </>
            ) : (
              <>
                <CnaePicker
                  label="CNAE"
                  value={cnaeSelection}
                  onChange={(selection) => setCnaeSelection(selection)}
                  onChangeCodigo={(codigo) =>
                    setFormData((prev) => ({ ...prev, cnae: codigo ?? "" }))
                  }
                  helperText="Selecione o CNAE do servico."
                />
                <AppTextInput
                  title="Codigo do servico"
                  value={formData.codigoServico}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      codigoServico: e.target.value,
                    }))
                  }
                />
              </>
            )}
            <AppSelectInput
              title="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              data={statusOptions}
            />
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex gap-3">
            <AppButton type="button" className="w-auto px-6" onClick={handleSubmit}>
              {editingId ? "Atualizar" : "Salvar"}
            </AppButton>
            <AppButton
              type="button"
              className="w-auto px-6"
              onClick={() => {
                resetForm();
                setFormOpen(false);
              }}
            >
              Cancelar
            </AppButton>
          </div>
        </Card>
      ) : null}

      <Card tone="amber">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          API de produtos/servicos preparada para integracao.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum produto ou servico." />}
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

export default ProdutosServicosPage;

