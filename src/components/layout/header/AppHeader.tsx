import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { AppMenuItem } from "../menu/types";
import AppMenu from "../menu/AppMenu";
import { useAuth } from "../../../shared/context/AuthContext";

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v10h5v-6h4v6h5V10" />
  </svg>
);

const IconBuilding = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <path d="M4 21h16" />
    <path d="M6 21V7l6-3 6 3v14" />
    <path d="M9 21v-5h6v5" />
  </svg>
);

const IconWallet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M16 12h4" />
  </svg>
);

const IconList = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </svg>
);

const IconCash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M8 12h8" />
  </svg>
);

const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <path d="M4 19h16" />
    <path d="M7 16V9" />
    <path d="M12 16V5" />
    <path d="M17 16v-7" />
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <path d="M12 3 19 6v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3Z" />
  </svg>
);

const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.94 3.06-.98-.57.02-1.12-1.75-3.02-1.1.28-.8-.8.28-1.1-3.02-1.75-1.12.02-.57-.98h-3.5l-.57.98-1.12-.02-3.02 1.75.28 1.1-.8.8-1.1-.28-1.75 3.02.02 1.12-.98.57v3.5l.98.57-.02 1.12 1.75 3.02 1.1-.28.8.8-.28 1.1 3.02 1.75 1.12-.02.57.98h3.5l.57-.98 1.12.02 3.02-1.75-.28-1.1.8-.8 1.1.28 1.75-3.02-.02-1.12.98-.57v-3.5ZM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
  </svg>
);

const AppHeader = () => {
  const { logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const menu: AppMenuItem[] = [
    { id: "dash", label: "Dashboard", to: "/", end: true, icon: <IconDashboard /> },
    {
      id: "empresas",
      label: "Empresas",
      to: "/empresa",
      icon: <IconBuilding />,
      children: [
        { id: "minhas_empresas", label: "Minhas Empresas", to: "/empresa", end: true, icon: <IconList /> },
        { id: "cadastro_empresa", label: "Cadastro Empresa", to: "/empresa/nova", icon: <IconBuilding /> },
      ],
    },
    {
      id: "financeiro",
      label: "Financeiro",
      icon: <IconWallet />,
      children: [
        { id: "contas", label: "Contas", to: "/financeiro/contas", icon: <IconWallet /> },
        { id: "categorias", label: "Categorias", to: "/financeiro/categorias", icon: <IconList /> },
        { id: "movimentos", label: "Movimentos", to: "/financeiro/movimentos", icon: <IconCash /> },
        { id: "caixa_financeiro", label: "Caixa", to: "/financeiro/caixa", icon: <IconChart /> },
        { id: "prolabore", label: "Pro-labore", to: "/financeiro/prolabore", icon: <IconCash /> },
      ],
    },
    {
      id: "fiscal",
      label: "Fiscal",
      icon: <IconShield />,
      children: [
        { id: "fechamento", label: "Fechamento", to: "/fiscal/fechamento", icon: <IconList /> },
        { id: "notas", label: "Notas", to: "/fiscal/notas", icon: <IconList /> },
      ],
    },
    { id: "relatorios", label: "Relatorios", to: "/relatorios", icon: <IconChart /> },
    {
      id: "tributacao",
      label: "Tributacao",
      icon: <IconShield />,
      children: [
        { id: "receitas", label: "Receitas", to: "/receitas", icon: <IconList /> },
        { id: "caixa", label: "Caixa", to: "/caixa", icon: <IconCash /> },
        { id: "conciliacao", label: "Conciliacao", to: "/conciliacao", icon: <IconList /> },
      ],
    },
    {
      id: "logout",
      label: "Sair",
      onClick: () => logout(),
      icon: <IconSettings />,
    },
  ];

  useEffect(() => {
    if (!settingsOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setSettingsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [settingsOpen]);

  return (
    <>
      <AppMenu title="Main" subtitle="Menu" menu={menu} />
      <div className="fixed right-6 top-4 z-50" ref={settingsRef}>
        <button
          type="button"
          aria-label="Configuracoes"
          aria-haspopup="menu"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-blue-500 hover:text-blue-600"
        >
          <IconSettings />
        </button>

        {settingsOpen ? (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            <div className="px-3 py-2 text-xs uppercase tracking-wide text-gray-400">
              Configuracoes
            </div>
            <Link
              to="/empresa"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setSettingsOpen(false)}
            >
              Empresas
            </Link>
            <Link
              to="/empresa/nova"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setSettingsOpen(false)}
            >
              Cadastrar empresa
            </Link>
            <Link
              to="/configuracoes/usuario"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setSettingsOpen(false)}
            >
              Configuracao do usuario
            </Link>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setSettingsOpen(false);
                logout();
              }}
            >
              Sair
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default AppHeader;
