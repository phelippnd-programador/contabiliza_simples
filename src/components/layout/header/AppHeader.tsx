import React from "react";
import type { AppMenuItem } from "../menu/types";
import AppMenu from "../menu/AppMenu";
import { useAuth } from "../../../shared/context/AuthContext";

const AppHeader = () => {
  const { logout } = useAuth();
  const menu: AppMenuItem[] = [
    { id: "dash", label: "Dashboard", to: "/", end: true },
    {
      id: "empresas",
      label: "Empresas",
      to: "/empresa",
      children: [
        { id: "minhas_empresas", label: "Minhas Empresas", to: "/empresa", end: true },
        { id: "cadastro_empresa", label: "Cadastro Empresa", to: "/empresa/nova" },
      ],
    },
    {
      id: "financeiro",
      label: "Financeiro",
      children: [
        { id: "contas", label: "Contas", to: "/financeiro/contas" },
        { id: "categorias", label: "Categorias", to: "/financeiro/categorias" },
        { id: "movimentos", label: "Movimentos", to: "/financeiro/movimentos" },
        { id: "caixa_financeiro", label: "Caixa", to: "/financeiro/caixa" },
        { id: "prolabore", label: "Pro-labore", to: "/financeiro/prolabore" },
      ],
    },
    {
      id: "fiscal",
      label: "Fiscal",
      children: [
        { id: "fechamento", label: "Fechamento", to: "/fiscal/fechamento" },
        { id: "notas", label: "Notas", to: "/fiscal/notas" },
      ],
    },
    { id: "relatorios", label: "Relatorios", to: "/relatorios" },
    {
      id: "tributacao",
      label: "Tributacao",
      children: [
        { id: "receitas", label: "Receitas", to: "/receitas" },
        { id: "caixa", label: "Caixa", to: "/caixa" },
        { id: "conciliacao", label: "Conciliacao", to: "/conciliacao" },
      ],
    },
    {
      id: "logout",
      label: "Sair",
      onClick: () => logout(),
    },
  ];

  return (
    <div className="flex w-full items-center justify-between shadow-md">
      <AppMenu title="Meu App" subtitle="Painel" menu={menu} />
    </div>
  );
};

export default AppHeader;
