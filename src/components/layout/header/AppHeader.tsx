import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { AppMenuItem } from "../menu/types";
import AppMenu from "../menu/AppMenu";
import { useAuth } from "../../../shared/context/AuthContext";
import { usePlan } from "../../../shared/context/PlanContext";
import { getPlanConfig, isModuleEnabled, planOptions } from "../../../app/plan/planConfig";
import type { AppPlan } from "../../../app/plan/types";

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

const filterMenuByPlan = (items: AppMenuItem[], plan: AppPlan): AppMenuItem[] =>
  items
    .map((item) => {
      if (item.moduleKey && !isModuleEnabled(plan, item.moduleKey)) {
        return null;
      }
      if (item.children?.length) {
        const children = filterMenuByPlan(item.children, plan);
        if (!children.length && !item.to) {
          return null;
        }
        return { ...item, children };
      }
      return item;
    })
    .filter(Boolean) as AppMenuItem[];

const AppHeader = () => {
  const { logout } = useAuth();
  const { plan, setPlan } = usePlan();
  const planConfig = getPlanConfig(plan);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    () => window.localStorage.getItem("theme") === "dark"
  );
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const menu: AppMenuItem[] = useMemo(
    () => [
      {
        id: "dash",
        label: "Dashboard",
        to: "/",
        end: true,
        icon: <IconDashboard />,
        moduleKey: "dashboard",
      },
      {
        id: "empresas",
        label: "Empresas",
        to: "/empresa",
        icon: <IconBuilding />,
        moduleKey: "empresas",
        children: [
          {
            id: "minhas_empresas",
            label: "Minhas Empresas",
            to: "/empresa",
            end: true,
            icon: <IconList />,
            moduleKey: "empresas",
          },
          // { id: "cadastro_empresa", label: "Cadastro Empresa", to: "/empresa/nova", icon: <IconBuilding /> },
        ],
      },
      {
        id: "financeiro",
        label: "Financeiro",
        icon: <IconWallet />,
        moduleKey: "financeiro",
        children: [
          {
            id: "contas",
            label: "Contas",
            to: "/financeiro/contas",
            icon: <IconWallet />,
            moduleKey: "financeiro",
          },
          {
            id: "cartoes",
            label: "Cartoes",
            to: "/financeiro/cartoes",
            icon: <IconWallet />,
            moduleKey: "financeiro",
          },
          {
            id: "contas_pagar",
            label: "Contas a pagar",
            to: "/financeiro/contas-pagar",
            icon: <IconCash />,
            moduleKey: "financeiro",
          },
          {
            id: "contas_receber",
            label: "Contas a receber",
            to: "/financeiro/contas-receber",
            icon: <IconCash />,
            moduleKey: "financeiro",
          },
          {
            id: "categorias",
            label: "Categorias",
            to: "/financeiro/categorias",
            icon: <IconList />,
            moduleKey: "financeiro",
          },
          {
            id: "movimentos",
            label: "Movimentos",
            to: "/financeiro/movimentos",
            icon: <IconCash />,
            moduleKey: "financeiro",
          },
          {
            id: "fechamento_financeiro",
            label: "Fechamento",
            to: "/financeiro/fechamento",
            icon: <IconList />,
            moduleKey: "financeiro",
          },
          {
            id: "conciliacao_financeira",
            label: "Conciliacao bancaria",
            to: "/financeiro/conciliacao",
            icon: <IconList />,
            moduleKey: "financeiro",
          },
          {
            id: "caixa_financeiro",
            label: "Caixa",
            to: "/financeiro/caixa",
            icon: <IconChart />,
            moduleKey: "financeiro",
          },
          {
            id: "projecao_financeira",
            label: "Projecao",
            to: "/financeiro/projecao",
            icon: <IconChart />,
            moduleKey: "projecao",
          },
          {
            id: "prolabore",
            label: "Pro-labore",
            to: "/financeiro/prolabore",
            icon: <IconCash />,
            moduleKey: "prolabore",
          },
        ],
      },
      {
        id: "cadastros",
        label: "Cadastros",
        icon: <IconList />,
        moduleKey: "cadastros",
        children: [
          {
            id: "clientes",
            label: "Clientes",
            to: "/cadastros/clientes",
            icon: <IconList />,
            moduleKey: "cadastros",
          },
          {
            id: "fornecedores",
            label: "Fornecedores",
            to: "/cadastros/fornecedores",
            icon: <IconList />,
            moduleKey: "cadastros",
          },
          {
            id: "produtos_servicos",
            label: "Produtos/Servicos",
            to: "/cadastros/produtos-servicos",
            icon: <IconList />,
            moduleKey: "cadastros",
          },
        ],
      },
      {
        id: "comercial",
        label: "Comercial",
        icon: <IconChart />,
        moduleKey: "comercial",
        children: [
          {
            id: "vendas",
            label: "Vendas",
            to: "/comercial/vendas",
            icon: <IconChart />,
            moduleKey: "comercial",
          },
          {
            id: "compras",
            label: "Compras",
            to: "/comercial/compras",
            icon: <IconChart />,
            moduleKey: "comercial",
          },
          {
            id: "vendas_analytics",
            label: "Analise de vendas",
            to: "/comercial/vendas/analytics",
            icon: <IconChart />,
            moduleKey: "comercial",
          },
        ],
      },
      {
        id: "fiscal",
        label: "Fiscal",
        icon: <IconShield />,
        moduleKey: "fiscal",
        children: [
          {
            id: "fechamento",
            label: "Fechamento",
            to: "/fiscal/fechamento",
            icon: <IconList />,
            moduleKey: "fiscal",
          },
          {
            id: "apuracao",
            label: "Apuracao",
            to: "/fiscal/apuracao",
            icon: <IconList />,
            moduleKey: "fiscal",
          },
          {
            id: "obrigacoes",
            label: "Obrigacoes",
            to: "/fiscal/obrigacoes",
            icon: <IconList />,
            moduleKey: "fiscal",
          },
          {
            id: "notas",
            label: "Notas",
            to: "/fiscal/notas",
            icon: <IconList />,
            moduleKey: "fiscal",
          },
        ],
      },
      {
        id: "relatorios",
        label: "Relatorios",
        to: "/relatorios",
        icon: <IconChart />,
        moduleKey: "relatorios",
      },
      {
        id: "estoque",
        label: "Estoque",
        icon: <IconList />,
        moduleKey: "estoque",
        children: [
          {
            id: "estoque_lista",
            label: "Itens",
            to: "/estoque",
            icon: <IconList />,
            moduleKey: "estoque",
            end: true,
          },
          {
            id: "estoque_movimentos",
            label: "Movimentos",
            to: "/estoque/movimentos",
            icon: <IconList />,
            moduleKey: "estoque",
          },
          {
            id: "estoque_importacao",
            label: "Importacao CSV",
            to: "/estoque/importacao",
            icon: <IconList />,
            moduleKey: "estoque",
          },
        ],
      },
      {
        id: "tributacao",
        label: "Tributacao",
        icon: <IconShield />,
        moduleKey: "tributacao",
        children: [
          {
            id: "receitas",
            label: "Receitas",
            to: "/receitas",
            icon: <IconList />,
            moduleKey: "tributacao",
          },
          {
            id: "caixa",
            label: "Caixa",
            to: "/caixa",
            icon: <IconCash />,
            moduleKey: "tributacao",
          },
          {
            id: "conciliacao",
            label: "Conciliacao",
            to: "/conciliacao",
            icon: <IconList />,
            moduleKey: "tributacao",
          },
        ],
      },
      {
        id: "integracoes",
        label: "Integracoes",
        icon: <IconList />,
        moduleKey: "integracoes",
        children: [
          {
            id: "bancos",
            label: "Bancos",
            to: "/integracoes/bancos",
            icon: <IconList />,
            moduleKey: "integracoes",
          },
          {
            id: "importacao_extratos",
            label: planConfig.labels.integracoes.importMenu,
            to: "/integracoes/importacao",
            icon: <IconList />,
            moduleKey: "integracoes",
          },
        ],
      },
      {
        id: "ponto",
        label: "Ponto",
        icon: <IconList />,
        moduleKey: "folha",
        children: [
          {
            id: "ponto_registro",
            label: "Registro diario",
            to: "/ponto/registro",
            icon: <IconList />,
            moduleKey: "folha",
          },
          {
            id: "ponto_fechamento",
            label: "Fechamento",
            to: "/ponto/fechamento",
            icon: <IconList />,
            moduleKey: "folha",
          },
          {
            id: "ponto_relatorios",
            label: "Relatorios",
            to: "/ponto/relatorios",
            icon: <IconList />,
            moduleKey: "folha",
          },
          {
            id: "ponto_calendario",
            label: "Calendario",
            to: "/ponto/calendario",
            icon: <IconList />,
            moduleKey: "folha",
          },
        ],
      },
      {
        id: "folha",
        label: planConfig.labels.menu.folha,
        icon: <IconList />,
        moduleKey: "folha",
        children: [
          {
            id: "rh_funcionarios",
            label: "Funcionarios",
            to: "/rh/funcionarios",
            icon: <IconList />,
            moduleKey: "folha",
          },
          {
            id: "rh_departamentos",
            label: "Departamentos",
            to: "/rh/estrutura/departamentos",
            icon: <IconList />,
            moduleKey: "folha",
          },
          {
            id: "rh_cargos",
            label: "Cargos",
            to: "/rh/estrutura/cargos",
            icon: <IconList />,
            moduleKey: "folha",
          },
          {
            id: "rh_centros_custo",
            label: "Centros de custo",
            to: "/rh/estrutura/centros-custo",
            icon: <IconList />,
            moduleKey: "folha",
          },
          {
            id: "rh_competencia",
            label: "Competencias",
            to: "/rh/folha/competencia",
            icon: <IconList />,
            moduleKey: "folha",
          },
          {
            id: "rh_eventos",
            label: "Eventos de folha",
            to: "/rh/folha/eventos",
            icon: <IconList />,
            moduleKey: "folha",
          },
          {
            id: "rh_lancamentos",
            label: "Lancamentos",
            to: "/rh/folha/lancamentos",
            icon: <IconList />,
            moduleKey: "folha",
          },
          {
            id: "rh_ferias",
            label: "Ferias",
            to: "/rh/ferias",
            icon: <IconList />,
            moduleKey: "folha",
          },
          {
            id: "rh_afastamentos",
            label: "Afastamentos",
            to: "/rh/afastamentos",
            icon: <IconList />,
            moduleKey: "folha",
          },
        ],
      },
      {
        id: "logout",
        label: "Sair",
        onClick: () => logout(),
        icon: <IconSettings />,
      },
    ],
    [logout, planConfig]
  );

  const filteredMenu = useMemo(() => filterMenuByPlan(menu, plan), [menu, plan]);


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

  const applyTheme = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
    document.body.classList.toggle("dark", dark);
    const root = document.getElementById("root");
    if (root) root.classList.toggle("dark", dark);
    window.localStorage.setItem("theme", dark ? "dark" : "light");
  };

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  return (
    <>
      <AppMenu title="Contabiliza Simples" subtitle="" menu={filteredMenu} />
      <div className="fixed right-6 top-4 z-50" ref={settingsRef}>
        <button
          type="button"
          aria-label="Configuracoes"
          aria-haspopup="menu"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
        >
          <IconSettings />
        </button>

        {settingsOpen ? (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-slate-200/70 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
          >
            <div className="px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-slate-400">
              Configuracoes
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100/70 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => {
                const next = !isDark;
                setIsDark(next);
                applyTheme(next);
              }}
            >
              <span>Modo escuro</span>
              <span
                className={[
                  "inline-flex h-5 w-9 items-center rounded-full border transition",
                  isDark ? "border-sky-500 bg-sky-500" : "border-slate-300 bg-slate-200",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-4 w-4 rounded-full bg-white shadow-sm transition",
                    isDark ? "translate-x-4" : "translate-x-1",
                  ].join(" ")}
                />
              </span>
            </button>
            <div className="px-4 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Plano
              </div>
              <select
                value={plan}
                onChange={(event) => setPlan(event.target.value as AppPlan)}
                className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-300 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
              >
                {planOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Link
              to="/empresa"
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/70 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => setSettingsOpen(false)}
            >
              Empresas
            </Link>
            <Link
              to="/empresa/nova"
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/70 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => setSettingsOpen(false)}
            >
              Cadastrar empresa
            </Link>
            <Link
              to="/configuracoes/usuario"
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/70 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => setSettingsOpen(false)}
            >
              Configuracao do usuario
            </Link>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
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
