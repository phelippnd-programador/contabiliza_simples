import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import { CnaePicker } from "../../../components/ui/picked/CnaePicker";
import { NcmPicker } from "../../../components/ui/picked/NcmPicker";
import type { CnaeItem } from "../../../shared/services/ibgeCnae";
import type { NcmItem } from "../../../shared/services/ncm";
import { listCategorias } from "../../financeiro/services/categorias.service";
import { listContas } from "../../financeiro/services/contas.service";
import { listEmpresas } from "../../empresa/services/empresas.service";
import { formatBRL } from "../../../shared/utils/formater";
import { notaDraftSchema } from "../validation/notaDraft.schema";
import { createDraft, emitir } from "../services/notas.service";
import type {
  NotaDraftRequest,
  NotaDraftResponse,
  NotaEmissaoResponse,
  NotaTipo,
} from "../types";

type ItemForm = NotaDraftRequest["itens"][number];

const tipoOptions = [
  { value: "SERVICO", label: "Servico" },
  { value: "PRODUTO", label: "Produto" },
];

const formaPagamentoOptions = [
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO", label: "Cartao" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];

const emptyItem = (): ItemForm => ({
  descricao: "",
  quantidade: 1,
  valorUnitario: 0,
  codigoServico: "",
  ncm: "",
  cfop: "",
  cnae: "",
});

const NotaNovaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [contas, setContas] = useState<Array<{ value: string; label: string }>>([]);
  const [categorias, setCategorias] = useState<Array<{ value: string; label: string }>>([]);
  const [empresas, setEmpresas] = useState<Array<{ value: string; label: string }>>([]);
  const [form, setForm] = useState<NotaDraftRequest>({
    empresaId: searchParams.get("empresaId") ?? "",
    tipo: "SERVICO",
    competencia: "",
    dataEmissao: "",
    tomador: {
      nomeRazao: "",
      documento: "",
      email: "",
      telefone: "",
      endereco: {
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: "",
        codigoMunicipioIbge: "",
        pais: "",
      },
    },
    itens: [emptyItem()],
    observacoes: "",
    financeiro: {
      gerarMovimentoCaixa: false,
      contaId: "",
      categoriaId: "",
      dataRecebimento: "",
      formaPagamento: undefined,
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiErrors, setApiErrors] = useState<NotaDraftResponse["faltando"]>([]);
  const [preview, setPreview] = useState<NotaDraftResponse["preview"]>();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [emissao, setEmissao] = useState<NotaEmissaoResponse | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [cnaeSelections, setCnaeSelections] = useState<Record<number, CnaeItem | null>>({});
  const [ncmSelections, setNcmSelections] = useState<Record<number, NcmItem | null>>({});

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const [contasResult, categoriasResult, empresasResult] =
        await Promise.allSettled([listContas(), listCategorias(), listEmpresas()]);
      if (!isMounted) return;
      if (contasResult.status === "fulfilled") {
        setContas(
          contasResult.value.map((conta) => ({
            value: conta.id,
            label: `${conta.nome} (${conta.banco})`,
          }))
        );
      } else {
        setContas([]);
      }

      if (categoriasResult.status === "fulfilled") {
        setCategorias(
          categoriasResult.value.map((categoria) => ({
            value: categoria.id,
            label: categoria.nome,
          }))
        );
      } else {
        setCategorias([]);
      }

      if (empresasResult.status === "fulfilled") {
        setEmpresas(
          empresasResult.value.map((empresa) => ({
            value: empresa.id,
            label:
              empresa.nomeFantasia?.trim() ||
              empresa.razaoSocial ||
              empresa.id,
          }))
        );
      } else {
        setEmpresas([]);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const itemErrors = useMemo(() => {
    return form.itens.map((_, index) => ({
      descricao: errors[`itens.${index}.descricao`],
      valorUnitario: errors[`itens.${index}.valorUnitario`],
      ncm: errors[`itens.${index}.ncm`],
      cfop: errors[`itens.${index}.cfop`],
    }));
  }, [errors, form.itens]);

  const setItem = (index: number, patch: Partial<ItemForm>) => {
    setForm((prev) => ({
      ...prev,
      itens: prev.itens.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, itens: [...prev.itens, emptyItem()] }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index),
    }));
    setCnaeSelections((prev) => {
      const next: Record<number, CnaeItem | null> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const idx = Number(key);
        if (Number.isNaN(idx) || idx === index) return;
        next[idx > index ? idx - 1 : idx] = value;
      });
      return next;
    });
    setNcmSelections((prev) => {
      const next: Record<number, NcmItem | null> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const idx = Number(key);
        if (Number.isNaN(idx) || idx === index) return;
        next[idx > index ? idx - 1 : idx] = value;
      });
      return next;
    });
  };

  const validateForm = () => {
    const result = notaDraftSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      if (!next[path]) next[path] = issue.message;
    });
    setErrors(next);
    return false;
  };

  const handleCreateDraft = async () => {
    if (!validateForm()) return;
    try {
      setSubmitError("");
      setApiErrors([]);
      setEmissao(null);
      const res = await createDraft(form);
      setDraftId(res.draftId);
      setPreview(res.preview);
      setApiErrors(res.faltando ?? []);
    } catch {
      setSubmitError("Nao foi possivel criar o rascunho.");
    }
  };

  const handleEmitir = async () => {
    if (!draftId) return;
    try {
      setSubmitError("");
      const res = await emitir(draftId);
      setEmissao(res);
    } catch {
      setSubmitError("Nao foi possivel emitir a nota.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Nova nota fiscal" />
          <AppSubTitle text="Preencha os dados para validar e emitir." />
        </div>
        <AppButton
          type="button"
          className="w-auto px-6"
          onClick={() => navigate("/fiscal/notas")}
        >
          Voltar
        </AppButton>
      </div>

      <Card>
        <AppSubTitle text="Dados da nota" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppSelectInput
            required
            title="Empresa"
            value={form.empresaId}
            onChange={(e) => setForm((prev) => ({ ...prev, empresaId: e.target.value }))}
            error={errors["empresaId"]}
            data={empresas}
            placeholder="Selecione"
          />

          <AppSelectInput
            required
            title="Tipo"
            value={form.tipo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tipo: e.target.value as NotaTipo }))
            }
            data={tipoOptions}
            error={errors["tipo"]}
          />

          <AppDateInput
            required
            title="Competencia"
            type="month"
            value={form.competencia}
            onChange={(e) => setForm((prev) => ({ ...prev, competencia: e.target.value }))}
            error={errors["competencia"]}
          />

          <AppDateInput
            title="Data de emissao"
            type="date"
            value={form.dataEmissao ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, dataEmissao: e.target.value }))}
          />
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Tomador" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppTextInput
            required
            title="Nome/Razao social"
            value={form.tomador.nomeRazao}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tomador: { ...prev.tomador, nomeRazao: e.target.value },
              }))
            }
            error={errors["tomador.nomeRazao"]}
          />

          <AppTextInput
            required
            title="CPF/CNPJ"
            value={form.tomador.documento}
            onValueChange={(raw) =>
              setForm((prev) => ({
                ...prev,
                tomador: { ...prev.tomador, documento: raw },
              }))
            }
            sanitizeRegex={/[0-9]/g}
            error={errors["tomador.documento"]}
          />

          <AppTextInput
            title="Email"
            value={form.tomador.email ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tomador: { ...prev.tomador, email: e.target.value },
              }))
            }
            error={errors["tomador.email"]}
          />

          <AppTextInput
            title="Telefone"
            value={form.tomador.telefone ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tomador: { ...prev.tomador, telefone: e.target.value },
              }))
            }
          />

          <AppTextInput
            title="CEP"
            value={form.tomador.endereco?.cep ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tomador: {
                  ...prev.tomador,
                  endereco: { ...prev.tomador.endereco, cep: e.target.value },
                },
              }))
            }
          />

          <AppTextInput
            title="Logradouro"
            value={form.tomador.endereco?.logradouro ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tomador: {
                  ...prev.tomador,
                  endereco: {
                    ...prev.tomador.endereco,
                    logradouro: e.target.value,
                  },
                },
              }))
            }
          />

          <AppTextInput
            title="Numero"
            value={form.tomador.endereco?.numero ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tomador: {
                  ...prev.tomador,
                  endereco: { ...prev.tomador.endereco, numero: e.target.value },
                },
              }))
            }
          />

          <AppTextInput
            title="Complemento"
            value={form.tomador.endereco?.complemento ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tomador: {
                  ...prev.tomador,
                  endereco: {
                    ...prev.tomador.endereco,
                    complemento: e.target.value,
                  },
                },
              }))
            }
          />

          <AppTextInput
            title="Bairro"
            value={form.tomador.endereco?.bairro ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tomador: {
                  ...prev.tomador,
                  endereco: { ...prev.tomador.endereco, bairro: e.target.value },
                },
              }))
            }
          />

          <AppTextInput
            title="Cidade"
            value={form.tomador.endereco?.cidade ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tomador: {
                  ...prev.tomador,
                  endereco: { ...prev.tomador.endereco, cidade: e.target.value },
                },
              }))
            }
          />

          <AppTextInput
            title="UF"
            value={form.tomador.endereco?.uf ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tomador: {
                  ...prev.tomador,
                  endereco: { ...prev.tomador.endereco, uf: e.target.value },
                },
              }))
            }
          />

          <AppTextInput
            title="Codigo IBGE"
            value={form.tomador.endereco?.codigoMunicipioIbge ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tomador: {
                  ...prev.tomador,
                  endereco: {
                    ...prev.tomador.endereco,
                    codigoMunicipioIbge: e.target.value,
                  },
                },
              }))
            }
          />

          <AppTextInput
            title="Pais"
            value={form.tomador.endereco?.pais ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tomador: {
                  ...prev.tomador,
                  endereco: { ...prev.tomador.endereco, pais: e.target.value },
                },
              }))
            }
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <AppSubTitle text="Itens" />
          <AppButton type="button" className="w-auto" onClick={addItem}>
            Adicionar item
          </AppButton>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {form.itens.length === 0 ? (
            <AppListNotFound texto="Nenhum item adicionado." />
          ) : null}

          {form.itens.map((item, index) => (
            <div key={`item-${index}`} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">Item {index + 1}</p>
                <AppButton
                  type="button"
                  className="w-auto"
                  onClick={() => removeItem(index)}
                  disabled={form.itens.length === 1}
                >
                  Remover
                </AppButton>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <AppTextInput
                  required
                  title="Descricao"
                  value={item.descricao}
                  onChange={(e) => setItem(index, { descricao: e.target.value })}
                  error={itemErrors[index]?.descricao}
                />

                <AppTextInput
                  title="Quantidade"
                  value={item.quantidade?.toString() ?? ""}
                  onChange={(e) =>
                    setItem(index, { quantidade: Number(e.target.value) || 1 })
                  }
                />

                <AppTextInput
                  required
                  title="Valor unitario"
                  value={item.valorUnitario ? String(item.valorUnitario) : ""}
                  onValueChange={(raw) =>
                    setItem(index, { valorUnitario: raw ? Number(raw) : 0 })
                  }
                  sanitizeRegex={/[0-9]/g}
                  formatter={formatBRL}
                  error={itemErrors[index]?.valorUnitario}
                />

                {form.tipo === "SERVICO" ? (
                  <>
                    <AppTextInput
                      title="Codigo do servico"
                      value={item.codigoServico ?? ""}
                      onChange={(e) => setItem(index, { codigoServico: e.target.value })}
                    />
                    <CnaePicker
                      label="CNAE"
                      value={
                        cnaeSelections[index] ??
                        (item.cnae ? { codigo: item.cnae, descricao: "" } : null)
                      }
                      onChange={(selection) =>
                        setCnaeSelections((prev) => ({
                          ...prev,
                          [index]: selection,
                        }))
                      }
                      onChangeCodigo={(codigo) =>
                        setItem(index, { cnae: codigo ?? "" })
                      }
                    />
                  </>
                ) : (
                  <>
                    <NcmPicker
                      required
                      label="NCM"
                      value={
                        ncmSelections[index] ??
                        (item.ncm ? { codigo: item.ncm, descricao: "" } : null)
                      }
                      onChange={(selection) =>
                        setNcmSelections((prev) => ({
                          ...prev,
                          [index]: selection,
                        }))
                      }
                      onChangeCodigo={(codigo) =>
                        setItem(index, { ncm: codigo ?? "" })
                      }
                      helperText="Selecione o NCM do item."
                      error={itemErrors[index]?.ncm}
                    />
                    <AppTextInput
                      required
                      title="CFOP"
                      value={item.cfop ?? ""}
                      onChange={(e) => setItem(index, { cfop: e.target.value })}
                      error={itemErrors[index]?.cfop}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Financeiro" />
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.financeiro?.gerarMovimentoCaixa ?? false}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                financeiro: {
                  ...prev.financeiro,
                  gerarMovimentoCaixa: e.target.checked,
                },
              }))
            }
          />
          Gerar movimento de caixa
        </label>

        {form.financeiro?.gerarMovimentoCaixa ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <AppSelectInput
              title="Conta"
              value={form.financeiro?.contaId ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  financeiro: { ...prev.financeiro, contaId: e.target.value },
                }))
              }
              data={contas}
              placeholder="Selecione"
            />

            <AppSelectInput
              title="Categoria"
              value={form.financeiro?.categoriaId ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  financeiro: { ...prev.financeiro, categoriaId: e.target.value },
                }))
              }
              data={categorias}
              placeholder="Selecione"
            />

            <AppDateInput
              title="Data de recebimento"
              type="date"
              value={form.financeiro?.dataRecebimento ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  financeiro: {
                    ...prev.financeiro,
                    dataRecebimento: e.target.value,
                  },
                }))
              }
            />

            <AppSelectInput
              title="Forma de pagamento"
              value={form.financeiro?.formaPagamento ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  financeiro: {
                    ...prev.financeiro,
                    formaPagamento: e.target.value as NotaDraftRequest["financeiro"]["formaPagamento"],
                  },
                }))
              }
              data={formaPagamentoOptions}
              placeholder="Selecione"
            />
          </div>
        ) : null}
      </Card>

      <Card>
        <AppSubTitle text="Observacoes" />
        <AppTextInput
          title="Observacoes"
          value={form.observacoes ?? ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, observacoes: e.target.value }))
          }
        />

        {submitError ? <p className="mt-4 text-sm text-red-600">{submitError}</p> : null}
        {apiErrors?.length ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold">Pendencias:</p>
            <ul className="mt-2 list-disc pl-4">
              {apiErrors.map((item, index) => (
                <li key={`${item.campo}-${index}`}>
                  {item.campo}: {item.mensagem}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {preview ? (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <p className="font-semibold text-gray-700">
              Total: {preview.total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
            {preview.impostosEstimados?.length ? (
              <ul className="mt-2 list-disc pl-4 text-gray-600">
                {preview.impostosEstimados.map((imposto, index) => (
                  <li key={`${imposto.nome}-${index}`}>
                    {imposto.nome}: {imposto.valor.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <AppButton type="button" className="w-auto" onClick={handleCreateDraft}>
            Validar / Criar rascunho
          </AppButton>
          <AppButton
            type="button"
            className="w-auto"
            onClick={handleEmitir}
            disabled={!draftId}
          >
            Emitir nota
          </AppButton>
        </div>

        {emissao ? (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-semibold">Status: {emissao.status}</p>
            {emissao.numero ? <p>Numero: {emissao.numero}</p> : null}
            {emissao.serie ? <p>Serie: {emissao.serie}</p> : null}
            {emissao.chave ? <p>Chave: {emissao.chave}</p> : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default NotaNovaPage;
