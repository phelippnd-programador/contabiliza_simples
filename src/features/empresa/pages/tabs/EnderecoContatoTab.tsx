import React, { useEffect, useRef, useState } from "react";
import { formatCEP, formatPhoneBR, formatUF, onlyDigits } from "../../../../shared/utils/formater";
import { buscarEnderecoPorCep } from "../../../../shared/services/viaCep";
import AppTextInput from "../../../../components/ui/input/AppTextInput";
import type { EnderecoContatoData, EmpresaCadastro } from "../../types";
import AppButton from "../../../../components/ui/button/AppButton";

interface Props {
  empresa?: EmpresaCadastro;
}

export function EnderecoContatoTab({ empresa }: Props) {
  const [value, setValue] = useState<EnderecoContatoData>({} as EnderecoContatoData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const lastCepRef = useRef<string>("");

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

  useEffect(() => {
    const cepDigits = onlyDigits(value?.cep ?? '');
    if (value.cep === undefined) return;
    if (cepDigits.length != 8) return;
    if (lastCepRef.current === cepDigits) return;

    const ctrl = new AbortController();
    (async () => {
      setCepLoading(true);
      setCepError(null);
      const data = await buscarEnderecoPorCep(cepDigits, ctrl.signal);

      if (!data) {
        setCepError("CEP nao encontrado");
        setCepLoading(false);
        return;
      }
      lastCepRef.current = cepDigits;
      setValue({
        ...value,
        logradouro: data.logradouro || value.logradouro || "",
        bairro: data.bairro || value.bairro || "",
        cidade: data.localidade || value.cidade || "",
        uf: data.uf || value.uf || "",
      });

      setCepLoading(false);
    })();

    return () => ctrl.abort();
  }, [value.cep]);

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
    if ((value.uf ?? '').length !== 2) e.uf = "UF invalido";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-base font-semibold">Contato</h2>

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
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-base font-semibold">Endereco</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <AppTextInput
            required
            title="CEP"
            value={formatCEP(value.cep ?? '')}
            formatter={formatCEP}
            sanitizeRegex={/\d/g}
            onValueChange={(raw) => setField("cep", raw)}
            helperText={cepLoading ? "Buscando endereco..." : cepError ?? undefined}
            error={errors.cep}
          />

          <div className="md:col-span-3">
            <AppTextInput
              disabled
              required
              title="Endereco"
              value={value.logradouro}
              onChange={(e) => setField("logradouro", e.target.value)}
              error={errors.logradouro}
            />
          </div>

          <AppTextInput
            required
            title="Numero"
            value={value.numero}
            onChange={(e) => setField("numero", e.target.value)}
            error={errors.numero}
          />

          <div className="md:col-span-3">
            <AppTextInput
              title="Complemento"
              value={value.complemento}
              onChange={(e) => setField("complemento", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <AppTextInput
              disabled
              required
              title="Bairro"
              value={value.bairro}
              onChange={(e) => setField("bairro", e.target.value)}
              error={errors.bairro}
              autoComplete="off"
            />
          </div>

          <AppTextInput
            disabled
            required
            title="Cidade"
            value={value.cidade}
            onChange={(e) => setField("cidade", e.target.value)}
            error={errors.cidade}
            autoComplete="off"
          />

          <AppTextInput
            disabled
            required
            title="UF"
            value={value.uf}
            formatter={formatUF}
            onChange={(e) => setField("uf", e.target.value)}
            error={errors.uf}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="footer flex gap-4">
        <AppButton onClick={handleSave}>Salvar</AppButton>
        <AppButton>Cancelar</AppButton>
      </div>
    </div>
  );
}
