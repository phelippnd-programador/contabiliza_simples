import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppButton from "../../../components/ui/button/AppButton";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import {
  tipoCategoriaOptions,
  tipoContaOptions,
} from "../../../shared/types/select-type";
import { getConta, saveConta } from "../services/contas.service";
import { TipoConta, TipoMovimentoCaixa, type ContaBancaria } from "../types";
import { BankPicker } from "../../../components/ui/picked/BankPicker";
import { getBankByValueCached, type BankItem } from "../../../shared/services/banks";

const ContaBancariaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Omit<ContaBancaria, "id">>({
    nome: "",
    banco: "",
    agencia: "",
    conta: "",
    digito: "",
    tipo: TipoConta.BANCO as TipoConta,
    categoria: TipoMovimentoCaixa.SAIDA as TipoMovimentoCaixa,
  });
  const [bankItem, setBankItem] = useState<BankItem | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const isBanco = form.tipo === TipoConta.BANCO;

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!id) return;
      const conta = await getConta(id);
      if (!isMounted) return;
      if (!conta) {
        setNotFound(true);
        return;
      }
      const { id: _id, ...rest } = conta;
      setForm(rest);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const value = form.banco?.trim();
    if (!value) {
      setBankItem(null);
      return () => {
        isMounted = false;
      };
    }
    const loadBank = async () => {
      const found = await getBankByValueCached(value);
      if (!isMounted) return;
      if (found) {
        setBankItem(found);
        return;
      }
      const code = /^\d+$/.test(value) ? Number(value) : undefined;
      setBankItem({
        ispb: "",
        name: value,
        code: Number.isFinite(code) ? code : undefined,
      });
    };
    loadBank();
    return () => {
      isMounted = false;
    };
  }, [form.banco]);

  useEffect(() => {
    if (!isBanco) {
      setForm((prev) => ({
        ...prev,
        banco: "",
        agencia: "",
        conta: "",
        digito: "",
      }));
      setBankItem(null);
    }
  }, [isBanco]);

  const handleChange =
    (field: keyof typeof form) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      };

  const handleSave = async () => {
    await saveConta({ ...form, id });
    navigate(`/financeiro/contas/`);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1">
        <AppTitle text={id ? "Editar conta bancaria" : "Criar conta bancaria"} />
        <AppSubTitle text="Cadastre uma conta para pagamentos e conciliacoes." />
      </div>

      <Card>
        <AppSubTitle text="Dados bancarios" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Preencha os dados basicos da conta. Campos com * sao obrigatorios.
        </p>

        {notFound ? (
          <div className="mt-4 rounded-2xl border border-rose-200/70 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            Conta nao encontrada.
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          
          <AppTextInput
            required
            title="Nome da conta"
            value={form.nome}
            onChange={handleChange("nome")}
          />

          {isBanco ? (
            <BankPicker
              required
              value={bankItem}
              onChange={(item) => {
                setBankItem(item);
                setForm((prev) => ({
                  ...prev,
                  banco: item ? (item.code != null ? String(item.code) : item.name) : "",
                }));
              }}
            />
          ) : null}

          {isBanco ? (
            <AppTextInput
              required
              title="Agencia"
              value={form.agencia}
              onChange={handleChange("agencia")}
              sanitizeRegex={/[0-9]/g}
            />
          ) : null}

          {isBanco ? (
            <AppTextInput
              required
              title="Conta"
              value={form.conta}
              onChange={handleChange("conta")}
              sanitizeRegex={/[0-9]/g}
            />
          ) : null}

          {isBanco ? (
            <AppTextInput
              title="Digito"
              value={form.digito}
              onChange={handleChange("digito")}
              sanitizeRegex={/[0-9]/g}
            />
          ) : null}

          <AppSelectInput
            required
            title="Tipo"
            value={form.tipo}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tipo: e.target.value as TipoConta,
              }))
            }
            data={tipoContaOptions}
          />

          <AppSelectInput
            required
            title="Categoria"
            value={form.categoria}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                categoria: e.target.value as TipoMovimentoCaixa,
              }))
            }
            data={tipoCategoriaOptions}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <AppButton onClick={handleSave}>Salvar</AppButton>
          <AppButton type="button" onClick={() => navigate("/financeiro/contas")}>
            Cancelar
          </AppButton>
        </div>
      </Card>
    </div>
  );
};

export default ContaBancariaPage;
