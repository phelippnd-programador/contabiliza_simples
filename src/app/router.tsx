import { createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";
import AppLayout from "../components/layout/AppLayout";
import NotFoundPage from "../shared/pages/errors/NotFoundPage";
import ForbiddenPage from "../shared/pages/errors/ForbiddenPage";
import ServerErrorPage from "../shared/pages/errors/ServerErrorPage";
import { RequireRole } from "../components/layout/auth/RequireRole";
import PlanRouteGuard from "../components/layout/auth/PlanRouteGuard";
import { PageLoading } from "../shared/pages/PageLoading";
import ConfiguracaoEmpresaPage from "../features/empresa/pages/ConfiguracaoEmpresaPage";
import type { PlanModule } from "./plan/types";

const CadastroEmpresaPage = lazy(() => import("../features/empresa/pages/CadastroEmpresaPage"));
const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const ForgotPasswordPage = lazy(
  () => import("../features/auth/pages/ForgotPasswordPage")
);
const CategoriasFinanceirasPage = lazy(
  () => import("../features/financeiro/pages/CategoriasFinanceirasPage")
);
const MovimentosCaixaPage = lazy(
  () => import("../features/financeiro/pages/MovimentosCaixaPage")
);
const CaixaPage = lazy(() => import("../features/financeiro/pages/CaixaPage"));
const FechamentoFiscalPage = lazy(
  () => import("../features/fiscal/pages/FechamentoFiscalPage")
);
const ProlaborePage = lazy(
  () => import("../features/financeiro/pages/ProlaborePage")
);
const RelatoriosPage = lazy(
  () => import("../features/relatorios/pages/RelatoriosPage")
);
const ContasBancariasPage = lazy(
  () => import("../features/financeiro/pages/ContasBancariasPage")
);
const ContaBancariaPage = lazy(
  () => import("../features/financeiro/pages/ContaBancariaPage")
);
const CartoesPage = lazy(
  () => import("../features/financeiro/pages/CartoesPage")
);
const CartaoPage = lazy(
  () => import("../features/financeiro/pages/CartaoPage")
);
const ContasPagarPage = lazy(
  () => import("../features/financeiro/pages/ContasPagarPage")
);
const ContasReceberPage = lazy(
  () => import("../features/financeiro/pages/ContasReceberPage")
);
const ProjecaoPage = lazy(
  () => import("../features/financeiro/pages/ProjecaoPage")
);
const DashboardPage = lazy(() => import("../features/dashboard/pages/DashboardPage"));
const EmpresasPage = lazy(() => import("../features/empresa/pages/EmpresasPage"));
const UsuarioConfigPage = lazy(
  () => import("../features/usuarios/pages/UsuarioConfigPage")
);
const NotasListPage = lazy(() => import("../features/notas/pages/NotasListPage"));
const NotaNovaPage = lazy(() => import("../features/notas/pages/NotaNovaPage"));
const NotaDetalhePage = lazy(() => import("../features/notas/pages/NotaDetalhePage"));
const ReceitasTributacaoPage = lazy(
  () => import("../features/tributacao/pages/ReceitasTributacaoPage")
);
const CaixaTributacaoPage = lazy(
  () => import("../features/tributacao/pages/CaixaTributacaoPage")
);
const ConciliacaoTributacaoPage = lazy(
  () => import("../features/tributacao/pages/ConciliacaoTributacaoPage")
);
const VendasPage = lazy(() => import("../features/comercial/pages/VendasPage"));
const ComprasPage = lazy(() => import("../features/comercial/pages/ComprasPage"));
const VendasAnalyticsPage = lazy(
  () => import("../features/comercial/pages/VendasAnalyticsPage")
);
const ClientesPage = lazy(() => import("../features/cadastros/pages/ClientesPage"));
const FornecedoresPage = lazy(
  () => import("../features/cadastros/pages/FornecedoresPage")
);
const ProdutosServicosPage = lazy(
  () => import("../features/cadastros/pages/ProdutosServicosPage")
);
const EstoquePage = lazy(() => import("../features/estoque/pages/EstoquePage"));
const EstoqueMovimentosPage = lazy(
  () => import("../features/estoque/pages/EstoqueMovimentosPage")
);
const EstoqueImportacaoPage = lazy(
  () => import("../features/estoque/pages/EstoqueImportacaoPage")
);
const ApuracaoImpostosPage = lazy(
  () => import("../features/fiscal/pages/ApuracaoImpostosPage")
);
const ObrigacoesPage = lazy(
  () => import("../features/fiscal/pages/ObrigacoesPage")
);
const IntegracoesBancariasPage = lazy(
  () => import("../features/integracoes/pages/IntegracoesBancariasPage")
);
const ImportWizardPage = lazy(
  () => import("../features/import/pages/ImportWizardPage")
);
const FolhaPagamentoPage = lazy(
  () => import("../features/folha/pages/FolhaPagamentoPage")
);
const FolhaSimuladorPage = lazy(
  () => import("../features/folha/pages/FolhaSimuladorPage")
);
const ColaboradoresPage = lazy(
  () => import("../features/folha/pages/ColaboradoresPage")
);

const withLoading = (node: React.ReactNode) => (
  <Suspense fallback={<PageLoading />}>{node}</Suspense>
);

const withPlanGuard = (
  roles: Array<"CONTADOR" | "EMPRESA">,
  module: PlanModule,
  node: React.ReactNode
) =>
  withLoading(
    <RequireRole allowedRoles={roles}>
      <PlanRouteGuard module={module}>{node}</PlanRouteGuard>
    </RequireRole>
  );

export const router = createBrowserRouter([
  { path: "/403", element: <ForbiddenPage /> },
  { path: "/login", element: withLoading(<LoginPage />) },
  { path: "/esqueci-senha", element: withLoading(<ForgotPasswordPage />) },
  { path: "*", element: <NotFoundPage /> },
  {
    path: "/",
    element: (
      <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
        <AppLayout />
      </RequireRole>
    ),
    errorElement: <ServerErrorPage />,
    children: [
      {
        index: true,
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "dashboard", <DashboardPage />),
      },
      {
        path: "empresa",
        element: withPlanGuard(["CONTADOR","EMPRESA"], "empresas", <EmpresasPage />),
      },
      {
        path: "empresa/nova",
        element: withPlanGuard(["EMPRESA"], "empresas", <CadastroEmpresaPage />),
      },
      {
        path: "empresa/:id",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "empresas", <ConfiguracaoEmpresaPage />),
      },
      {
        path: "receitas",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "tributacao", <ReceitasTributacaoPage />),
      },
      {
        path: "caixa",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "tributacao", <CaixaTributacaoPage />),
      },
      {
        path: "conciliacao",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "tributacao", <ConciliacaoTributacaoPage />),
      },
      {
        path: "financeiro/contas",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "financeiro", <ContasBancariasPage />),
      },
      {
        path: "financeiro/cartoes",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "financeiro", <CartoesPage />),
      },
      {
        path: "financeiro/cartoes/novo",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "financeiro", <CartaoPage />),
      },
      {
        path: "financeiro/cartoes/:id",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "financeiro", <CartaoPage />),
      },
      {
        path: "financeiro/contas/nova",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "financeiro", <ContaBancariaPage />),
      },
      {
        path: "financeiro/contas/:id",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "financeiro", <ContaBancariaPage />),
      },
      {
        path: "financeiro/contas-pagar",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "financeiro", <ContasPagarPage />),
      },
      {
        path: "financeiro/contas-receber",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "financeiro", <ContasReceberPage />),
      },
      {
        path: "financeiro/categorias",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "financeiro", <CategoriasFinanceirasPage />),
      },
      {
        path: "financeiro/movimentos",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "financeiro", <MovimentosCaixaPage />),
      },
      {
        path: "financeiro/caixa",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "financeiro", <CaixaPage />),
      },
      {
        path: "financeiro/projecao",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "projecao", <ProjecaoPage />),
      },
      {
        path: "financeiro/prolabore",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "prolabore", <ProlaborePage />),
      },
      {
        path: "fiscal/fechamento",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "fiscal", <FechamentoFiscalPage />),
      },
      {
        path: "fiscal/apuracao",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "fiscal", <ApuracaoImpostosPage />),
      },
      {
        path: "fiscal/obrigacoes",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "fiscal", <ObrigacoesPage />),
      },
      {
        path: "fiscal/notas",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "fiscal", <NotasListPage />),
      },
      {
        path: "fiscal/notas/nova",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "fiscal", <NotaNovaPage />),
      },
      {
        path: "fiscal/notas/:id",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "fiscal", <NotaDetalhePage />),
      },
      {
        path: "relatorios",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "relatorios", <RelatoriosPage />),
      },
      {
        path: "comercial/vendas",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "comercial", <VendasPage />),
      },
      {
        path: "comercial/compras",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "comercial", <ComprasPage />),
      },
      {
        path: "comercial/vendas/analytics",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "comercial", <VendasAnalyticsPage />),
      },
      {
        path: "cadastros/clientes",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "cadastros", <ClientesPage />),
      },
      {
        path: "cadastros/fornecedores",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "cadastros", <FornecedoresPage />),
      },
      {
        path: "cadastros/produtos-servicos",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "cadastros", <ProdutosServicosPage />),
      },
      {
        path: "estoque",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "estoque", <EstoquePage /> ),
      },
      {
        path: "estoque/movimentos",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "estoque", <EstoqueMovimentosPage />),
      },
      {
        path: "estoque/importacao",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "estoque", <EstoqueImportacaoPage />),
      },
      {
        path: "integracoes/bancos",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "integracoes", <IntegracoesBancariasPage />),
      },
      {
        path: "integracoes/importacao",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "integracoes", <ImportWizardPage />),
      },
      {
        path: "folha",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "folha", <FolhaPagamentoPage />),
      },
      {
        path: "folha/simulador",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "folha", <FolhaSimuladorPage />),
      },
      {
        path: "folha/colaboradores",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "folha", <ColaboradoresPage />),
      },
      {
        path: "configuracoes/usuario",
        element: withPlanGuard(["CONTADOR", "EMPRESA"], "dashboard", <UsuarioConfigPage />),
      },

      // 404 dentro do layout (eu recomendo deixar ligado)

    ],
  },
]);
