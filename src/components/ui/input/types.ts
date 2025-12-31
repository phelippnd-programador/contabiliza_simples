import type { AnexoSimples, RegimeTributario } from "../../../features/tributacao/types";


export type TributacaoValue = {
  regimeTributario?: RegimeTributario;
  rbt12?: number; // number limpo
  anexoSimples?: AnexoSimples;
  percentualFatorR?: number; // number limpo (0..100)
};

export type TributacaoErrors = Partial<Record<keyof TributacaoValue, string>>;
