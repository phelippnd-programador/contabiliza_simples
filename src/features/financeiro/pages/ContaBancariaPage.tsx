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
  const [notFound, setNotFound] = useState<boolean>(false);

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
    <div className="flex w-full flex-col items-center justify-center p-5">
      <AppTitle text={id ? "Editar conta bancaria" : "Criar conta bancaria"} />
      <AppSubTitle text="Cadastre uma conta para pagamentos e conciliacoes." />

      <Card>
        <AppSubTitle text="Dados bancarios" />
        <small>
          Preencha os dados basicos da conta. Campos com * sao obrigatorios.
        </small>

        {notFound ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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

          <AppTextInput
            required
            title="Banco"
            value={form.banco}
            onChange={handleChange("banco")}
          />

          <AppTextInput
            required
            title="Agencia"
            value={form.agencia}
            onChange={handleChange("agencia")}
            sanitizeRegex={/[0-9]/g}
          />

          <AppTextInput
            required
            title="Conta"
            value={form.conta}
            onChange={handleChange("conta")}
            sanitizeRegex={/[0-9]/g}
          />

          <AppTextInput
            title="Digito"
            value={form.digito}
            onChange={handleChange("digito")}
            sanitizeRegex={/[0-9]/g}
          />

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

        <div className="mt-6 flex gap-4">
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
