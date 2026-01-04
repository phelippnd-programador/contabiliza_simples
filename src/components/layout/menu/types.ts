import type { PlanModule } from "../../../app/plan/types";

export type AppMenuItem = {
  id: string;
  label: string;
  to?: string;                 // <-- agora é opcional (grupo não precisa)
  icon?: React.ReactNode;
  end?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: AppMenuItem[];    // <-- submenu
  moduleKey?: PlanModule;
};
