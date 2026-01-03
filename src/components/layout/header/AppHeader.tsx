import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { AppMenuItem } from "../menu/types";
import AppMenu from "../menu/AppMenu";
import { useAuth } from "../../../shared/context/AuthContext";

const AppHeader = () => {
  const { logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
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
    <div className="flex w-full items-center justify-between shadow-md">
      <AppMenu title="Meu App" subtitle="Painel" menu={menu} />
      <div className="relative mr-4" ref={settingsRef}>
        <button
          type="button"
          aria-label="Configuracoes"
          aria-haspopup="menu"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-blue-500 hover:text-blue-600"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="h-5 w-5"
          >
            <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.94 3.06-.98-.57.02-1.12-1.75-3.02-1.1.28-.8-.8.28-1.1-3.02-1.75-1.12.02-.57-.98h-3.5l-.57.98-1.12-.02-3.02 1.75.28 1.1-.8.8-1.1-.28-1.75 3.02.02 1.12-.98.57v3.5l.98.57-.02 1.12 1.75 3.02 1.1-.28.8.8-.28 1.1 3.02 1.75 1.12-.02.57.98h3.5l.57-.98 1.12.02 3.02-1.75-.28-1.1.8-.8 1.1.28 1.75-3.02-.02-1.12.98-.57v-3.5ZM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
          </svg>
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
    </div>
  );
};

export default AppHeader;
