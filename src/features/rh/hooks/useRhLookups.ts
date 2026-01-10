import { useCallback, useEffect, useState } from "react";
import {
  listCargos,
  listCentrosCusto,
  listDepartamentos,
  listFuncionarios,
} from "../services/rh.service";
import type {
  Cargo,
  CentroCusto,
  Departamento,
  Funcionario,
  ListParams,
} from "../types/rh.types";

const useListState = <T,>(
  loader: (params?: ListParams) => Promise<{ data: T[] }>
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(
    async (params?: ListParams) => {
      try {
        setLoading(true);
        setError("");
        const res = await loader(params);
        setData(res.data);
      } catch {
        setData([]);
        setError("Falha ao carregar.");
      } finally {
        setLoading(false);
      }
    },
    [loader]
  );

  return { data, loading, error, reload };
};

export const useDepartamentos = (params?: ListParams) => {
  const state = useListState<Departamento>(listDepartamentos);
  const key = JSON.stringify(params ?? {});
  useEffect(() => {
    state.reload(params);
  }, [key, state.reload]);
  return state;
};

export const useCargos = (params?: ListParams) => {
  const state = useListState<Cargo>(listCargos);
  const key = JSON.stringify(params ?? {});
  useEffect(() => {
    state.reload(params);
  }, [key, state.reload]);
  return state;
};

export const useCentrosCusto = (params?: ListParams) => {
  const state = useListState<CentroCusto>(listCentrosCusto);
  const key = JSON.stringify(params ?? {});
  useEffect(() => {
    state.reload(params);
  }, [key, state.reload]);
  return state;
};

export const useFuncionarios = (params?: ListParams) => {
  const state = useListState<Funcionario>(listFuncionarios);
  const key = JSON.stringify(params ?? {});
  useEffect(() => {
    state.reload(params);
  }, [key, state.reload]);
  return state;
};
