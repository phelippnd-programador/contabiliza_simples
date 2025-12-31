import type { Role } from "../../../shared/types/auth-types";
import type { ReactNode } from "react";
import { useAuth } from "../../../shared/context/AuthContext";
import { Navigate } from "react-router-dom";

type Props = {
  allowedRoles: Role[];
  children: ReactNode;
};
export function RequireRole({ allowedRoles, children }: Props) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!role) return null; // ou um loading

  if (!allowedRoles.includes(role)) return <Navigate to="/403" replace />;

  return <>{children}</>;
}

