import React, { createContext, useContext, useMemo, useState } from "react";
import type { AppPlan } from "../../app/plan/types";

type PlanState = {
  plan: AppPlan;
  setPlan: (plan: AppPlan) => void;
  isResidential: boolean;
  isCommercial: boolean;
};

const PLAN_STORAGE_KEY = "app_plan";

const resolveInitialPlan = (): AppPlan => {
  const stored = window.localStorage.getItem(PLAN_STORAGE_KEY);
  if (stored === "RESIDENTIAL" || stored === "COMMERCIAL") {
    return stored;
  }
  return "COMMERCIAL";
};

const PlanContext = createContext<PlanState | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlanState] = useState<AppPlan>(() => resolveInitialPlan());

  const setPlan = (next: AppPlan) => {
    setPlanState(next);
    window.localStorage.setItem(PLAN_STORAGE_KEY, next);
  };

  const value = useMemo(
    () => ({
      plan,
      setPlan,
      isResidential: plan === "RESIDENTIAL",
      isCommercial: plan === "COMMERCIAL",
    }),
    [plan]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error("usePlan deve ser usado dentro de PlanProvider");
  }
  return ctx;
}
