import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import { BankPicker } from "../../../components/ui/picked/BankPicker";
import { formatBRL } from "../../../shared/utils/formater";
import {
  getBankByValueCached,
  type BankItem,
} from "../../../shared/services/banks";
import { getCartao, saveCartao } from "../services/cartoes.service";
import type { CartaoCredito } from "../types";

const CartaoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Omit<CartaoCredito, "id">>({
    nome: "",
    banco: "",
    vencimentoDia: 0,
    fechamentoDia: 0,
    limiteInicial: 0,
  });
  const [bankItem, setBankItem] = useState<BankItem | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!id) return;
      const cartao = await getCartao(id);
      if (!isMounted) return;
      if (!cartao) {
        setNotFound(true);
        return;
      }
      const { id: _id, ...rest } = cartao;
      const legacyVencimento = (rest as unknown as { vencimento?: string }).vencimento;
      const vencimentoDia =
        rest.vencimentoDia ||
        (legacyVencimento ? Number(legacyVencimento.split("-")[2]) : 0);
      setForm({ ...rest, vencimentoDia, fechamentoDia: rest.fechamentoDia ?? 0 });
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

  const handleSave = async () => {
    await saveCartao({ ...form, id });
    navigate("/financeiro/cartoes");
  };

  return (
    <div className="flex w-full flex-col items-center justify-center p-5">
      <AppTitle text={id ? "Editar cartao" : "Criar cartao"} />
      <AppSubTitle text="Cadastre cartoes com vencimento e limite inicial." />

      <Card>
        <AppSubTitle text="Dados do cartao" />
        <small>
          Preencha os dados basicos do cartao. Campos com * sao obrigatorios.
        </small>

        {notFound ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Cartao nao encontrado.
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppTextInput
            required
            title="Nome do cartao"
            value={form.nome}
            onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
          />

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

          <AppSelectInput
            required
            title="Vencimento do cartao (dia)"
            value={form.vencimentoDia ? String(form.vencimentoDia) : ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                vencimentoDia: Number(e.target.value || "0"),
              }))
            }
            data={Array.from({ length: 28 }, (_, index) => {
              const value = String(index + 1);
              return { value, label: value };
            })}
            placeholder="Selecione"
          />

          <AppSelectInput
            required
            title="Fechamento da fatura (dia)"
            value={form.fechamentoDia ? String(form.fechamentoDia) : ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                fechamentoDia: Number(e.target.value || "0"),
              }))
            }
            data={Array.from({ length: 28 }, (_, index) => {
              const value = String(index + 1);
              return { value, label: value };
            })}
            placeholder="Selecione"
          />

          <AppTextInput
            required
            title="Limite inicial"
            value={form.limiteInicial ? String(form.limiteInicial) : ""}
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            onValueChange={(raw) =>
              setForm((prev) => ({
                ...prev,
                limiteInicial: Number(raw || "0"),
              }))
            }
          />
        </div>

        <div className="mt-6 flex gap-4">
          <AppButton onClick={handleSave}>Salvar</AppButton>
          <AppButton type="button" onClick={() => navigate("/financeiro/cartoes")}>
            Cancelar
          </AppButton>
        </div>
      </Card>
    </div>
  );
};

export default CartaoPage;
