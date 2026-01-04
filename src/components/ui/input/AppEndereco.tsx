import React, { useEffect, useRef, useState } from "react";
import AppTextInput from "./AppTextInput";
import { buscarEnderecoPorCep } from "../../../shared/services/viaCep";
import { formatCEP, formatUF, onlyDigits } from "../../../shared/utils/formater";

export type EnderecoValue = {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  codigoMunicipioIbge?: string;
  pais?: string;
};

type RequiredFields = Partial<Record<keyof EnderecoValue, boolean>>;

type AppEnderecoProps = {
  value: EnderecoValue;
  onChange: (next: EnderecoValue) => void;
  requiredFields?: RequiredFields;
  errors?: Partial<Record<keyof EnderecoValue, string>>;
  disableAutoFillFields?: boolean;
};

const AppEndereco = ({
  value,
  onChange,
  requiredFields,
  errors,
  disableAutoFillFields,
}: AppEnderecoProps) => {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const lastCepRef = useRef<string>("");

  const isRequired = (field: keyof EnderecoValue) =>
    Boolean(requiredFields?.[field]);

  useEffect(() => {
    const cepDigits = onlyDigits(value?.cep ?? "");
    if (value.cep === undefined) return;
    if (cepDigits.length !== 8) return;
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
      onChange({
        ...value,
        logradouro: data.logradouro || value.logradouro || "",
        bairro: data.bairro || value.bairro || "",
        cidade: data.localidade || value.cidade || "",
        uf: data.uf || value.uf || "",
      });
      setCepLoading(false);
    })();

    return () => ctrl.abort();
  }, [onChange, value]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <AppTextInput
        required={isRequired("cep")}
        title="CEP"
        value={formatCEP(value.cep ?? "")}
        formatter={formatCEP}
        sanitizeRegex={/\d/g}
        onValueChange={(raw) => onChange({ ...value, cep: raw })}
        helperText={cepLoading ? "Buscando endereco..." : cepError ?? undefined}
        error={errors?.cep}
      />

      <div className="md:col-span-3">
        <AppTextInput
          required={isRequired("logradouro")}
          title="Endereco"
          value={value.logradouro ?? ""}
          onChange={(e) => onChange({ ...value, logradouro: e.target.value })}
          error={errors?.logradouro}
          disabled={disableAutoFillFields}
        />
      </div>

      <AppTextInput
        required={isRequired("numero")}
        title="Numero"
        value={value.numero ?? ""}
        onChange={(e) => onChange({ ...value, numero: e.target.value })}
        error={errors?.numero}
      />

      <div className="md:col-span-3">
        <AppTextInput
          title="Complemento"
          value={value.complemento ?? ""}
          onChange={(e) => onChange({ ...value, complemento: e.target.value })}
        />
      </div>

      <div className="md:col-span-2">
        <AppTextInput
          required={isRequired("bairro")}
          title="Bairro"
          value={value.bairro ?? ""}
          onChange={(e) => onChange({ ...value, bairro: e.target.value })}
          error={errors?.bairro}
          autoComplete="off"
          disabled={disableAutoFillFields}
        />
      </div>

      <AppTextInput
        required={isRequired("cidade")}
        title="Cidade"
        value={value.cidade ?? ""}
        onChange={(e) => onChange({ ...value, cidade: e.target.value })}
        error={errors?.cidade}
        autoComplete="off"
        disabled={disableAutoFillFields}
      />

      <AppTextInput
        required={isRequired("uf")}
        title="UF"
        value={value.uf ?? ""}
        formatter={formatUF}
        onChange={(e) => onChange({ ...value, uf: e.target.value })}
        error={errors?.uf}
        autoComplete="off"
        disabled={disableAutoFillFields}
      />

      <AppTextInput
        title="Codigo IBGE"
        value={value.codigoMunicipioIbge ?? ""}
        onChange={(e) =>
          onChange({ ...value, codigoMunicipioIbge: e.target.value })
        }
      />

      <AppTextInput
        title="Pais"
        value={value.pais ?? ""}
        onChange={(e) => onChange({ ...value, pais: e.target.value })}
      />
    </div>
  );
};

export default AppEndereco;
