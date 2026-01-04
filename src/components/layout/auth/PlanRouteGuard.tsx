import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePlan } from "../../../shared/context/PlanContext";
import type { PlanModule } from "../../../app/plan/types";
import { isModuleEnabled } from "../../../app/plan/planConfig";

type PlanRouteGuardProps = {
  module: PlanModule;
  children: React.ReactNode;
  fallbackTo?: string;
};

const PlanRouteGuard = ({ module, children, fallbackTo = "/" }: PlanRouteGuardProps) => {
  const { plan } = usePlan();
  const location = useLocation();

  if (!isModuleEnabled(plan, module)) {
    return <Navigate to={fallbackTo} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default PlanRouteGuard;
