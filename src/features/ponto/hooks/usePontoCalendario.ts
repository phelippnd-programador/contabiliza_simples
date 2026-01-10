import { useCallback, useEffect, useState } from "react";
import {
  loadCalendarioFuncionarioLocal,
  loadCalendarioLocal,
  saveCalendarioFuncionarioLocal,
  saveCalendarioLocal,
} from "../utils/pontoCalendario";
import type { PontoCalendarioFuncionarioItem, PontoCalendarioItem } from "../utils/pontoCalendario";
import {
  deleteCalendarioFuncionarioItem,
  deleteCalendarioItem,
  listCalendario,
  listCalendarioFuncionario,
  saveCalendarioFuncionarioItem,
  saveCalendarioItem,
} from "../services/pontoCalendario.service";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export const usePontoCalendario = () => {
  const [calendario, setCalendario] = useState<PontoCalendarioItem[]>([]);
  const [calendarioFuncionario, setCalendarioFuncionario] = useState<PontoCalendarioFuncionarioItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!API_BASE) {
        setCalendario(loadCalendarioLocal());
        setCalendarioFuncionario(loadCalendarioFuncionarioLocal());
        return;
      }
      const [globalRes, funcRes] = await Promise.all([
        listCalendario(),
        listCalendarioFuncionario(),
      ]);
      setCalendario(globalRes);
      setCalendarioFuncionario(funcRes);
    } catch {
      setCalendario(loadCalendarioLocal());
      setCalendarioFuncionario(loadCalendarioFuncionarioLocal());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persistCalendario = useCallback(async (payload: PontoCalendarioItem) => {
    if (!API_BASE) {
      const withId = payload.id ? payload : { ...payload, id: Date.now() };
      const next = [
        ...calendario.filter((item) => item.date !== payload.date),
        withId,
      ];
      setCalendario(next);
      saveCalendarioLocal(next);
      return;
    }
    const existing = calendario.find((item) => item.date === payload.date);
    const saved = await saveCalendarioItem({ ...payload, id: existing?.id });
    setCalendario((prev) => {
      const filtered = prev.filter((item) => item.id !== saved.id && item.date !== saved.date);
      return [...filtered, saved];
    });
  }, [calendario]);

  const removeCalendario = useCallback(async (id: number | string) => {
    if (!API_BASE) {
      const next = calendario.filter((item) => item.id !== id && item.date !== id);
      setCalendario(next);
      saveCalendarioLocal(next);
      return;
    }
    await deleteCalendarioItem(id);
    setCalendario((prev) => prev.filter((item) => item.id !== id));
  }, [calendario]);

  const persistCalendarioFuncionario = useCallback(
    async (payload: PontoCalendarioFuncionarioItem) => {
      if (!API_BASE) {
        const withId = payload.id ? payload : { ...payload, id: Date.now() };
        const next = [
          ...calendarioFuncionario.filter(
            (item) =>
              String(item.funcionarioId) !== String(payload.funcionarioId) || item.date !== payload.date
          ),
          withId,
        ];
        setCalendarioFuncionario(next);
        saveCalendarioFuncionarioLocal(next);
        return;
      }
      const existing = calendarioFuncionario.find(
        (item) =>
          String(item.funcionarioId) === String(payload.funcionarioId) &&
          item.date === payload.date
      );
      const saved = await saveCalendarioFuncionarioItem({ ...payload, id: existing?.id });
      setCalendarioFuncionario((prev) => {
        const filtered = prev.filter(
          (item) =>
            item.id !== saved.id &&
            !(String(item.funcionarioId) === String(saved.funcionarioId) && item.date === saved.date)
        );
        return [...filtered, saved];
      });
    },
    [calendarioFuncionario]
  );

  const removeCalendarioFuncionario = useCallback(
    async (id: number | string) => {
      if (!API_BASE) {
        const next = calendarioFuncionario.filter((item) => item.id !== id);
        setCalendarioFuncionario(next);
        saveCalendarioFuncionarioLocal(next);
        return;
      }
      await deleteCalendarioFuncionarioItem(id);
      setCalendarioFuncionario((prev) => prev.filter((item) => item.id !== id));
    },
    [calendarioFuncionario]
  );

  return {
    calendario,
    calendarioFuncionario,
    loading,
    reload: load,
    saveCalendario: persistCalendario,
    removeCalendario,
    saveCalendarioFuncionario: persistCalendarioFuncionario,
    removeCalendarioFuncionario,
  };
};
