import React, { useEffect, useState } from "react";
import { formatPhoneBR, onlyDigits } from "../../../../shared/utils/formater";
import AppTextInput from "../../../../components/ui/input/AppTextInput";
import AppEndereco from "../../../../components/ui/input/AppEndereco";
import type { EnderecoContatoData, EmpresaCadastro } from "../../types";
import AppButton from "../../../../components/ui/button/AppButton";
import Card from "../../../../components/ui/card/Card";
import AppTitle, { AppSubTitle } from "../../../../components/ui/text/AppTitle";

interface Props {
  empresa?: EmpresaCadastro;
}

export function EnderecoContatoTab({ empresa }: Props) {
  const [value, setValue] = useState<EnderecoContatoData>(
    {} as EnderecoContatoData
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValue((prev) => ({
      ...prev,
      email: empresa?.email ?? prev.email,
      telefone: empresa?.telefone ?? prev.telefone,
    }));
  }, [empresa]);

  function setField<K extends keyof EnderecoContatoData>(
    field: K,
    val: EnderecoContatoData[K]
  ) {
    setValue({ ...value, [field]: val });
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};

    if (!value.email) e.email = "Informe o e-mail";
    if (!value.telefone || onlyDigits(value.telefone).length < 10)
      e.telefone = "Telefone invalido";
    if (onlyDigits(value.cep).length !== 8) e.cep = "CEP invalido";
    if (!value.logradouro) e.logradouro = "Informe o endereco";
    if (!value.numero) e.numero = "Informe o numero";
    if (!value.bairro) e.bairro = "Informe o bairro";
    if (!value.cidade) e.cidade = "Informe a cidade";
    if ((value.uf ?? "").length !== 2) e.uf = "UF invalido";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4">
        <AppTitle text='Endereco e Contato da empresa' />
        <AppSubTitle text="InformaÇõÇœo de contato e endereco da empresa." />
      </div>
      <Card>
        <AppSubTitle text="Contato" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppTextInput
            required
            title="E-mail"
            value={value.email}
            onChange={(e) => setField("email", e.target.value)}
            error={errors.email}
          />

          <AppTextInput
            required
            title="Telefone"
            value={value.telefone}
            formatter={formatPhoneBR}
            sanitizeRegex={/\d/g}
            onValueChange={(raw) => setField("telefone", raw)}
            error={errors.telefone}
          />
        </div>
      </Card>

      <Card>
        <AppSubTitle text="EndereÇõo" />

        <AppEndereco
          value={value}
          onChange={(next) => setValue({ ...value, ...next })}
          errors={{
            cep: errors.cep,
            logradouro: errors.logradouro,
            numero: errors.numero,
            bairro: errors.bairro,
            cidade: errors.cidade,
            uf: errors.uf,
          }}
          requiredFields={{
            cep: true,
            logradouro: true,
            numero: true,
            bairro: true,
            cidade: true,
            uf: true,
          }}
          disableAutoFillFields
        />
      </Card>

      <div className="footer flex gap-4">
        <AppButton onClick={handleSave}>Salvar</AppButton>
        <AppButton>Cancelar</AppButton>
      </div>
    </div>
  );
}
