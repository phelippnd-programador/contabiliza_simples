import { createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";
import AppLayout from "../components/layout/AppLayout";
import NotFoundPage from "../shared/pages/errors/NotFoundPage";
import ForbiddenPage from "../shared/pages/errors/ForbiddenPage";
import ServerErrorPage from "../shared/pages/errors/ServerErrorPage";
import { RequireRole } from "../components/layout/auth/RequireRole";
import { PageLoading } from "../shared/pages/PageLoading";
import ConfiguracaoEmpresaPage from "../features/empresa/pages/ConfiguracaoEmpresaPage";

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
const ContasPagarPage = lazy(
  () => import("../features/financeiro/pages/ContasPagarPage")
);
const ContasReceberPage = lazy(
  () => import("../features/financeiro/pages/ContasReceberPage")
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
const ClientesPage = lazy(() => import("../features/cadastros/pages/ClientesPage"));
const FornecedoresPage = lazy(
  () => import("../features/cadastros/pages/FornecedoresPage")
);
const ProdutosServicosPage = lazy(
  () => import("../features/cadastros/pages/ProdutosServicosPage")
);
const EstoquePage = lazy(() => import("../features/estoque/pages/EstoquePage"));
const ApuracaoImpostosPage = lazy(
  () => import("../features/fiscal/pages/ApuracaoImpostosPage")
);
const ObrigacoesPage = lazy(
  () => import("../features/fiscal/pages/ObrigacoesPage")
);
const IntegracoesBancariasPage = lazy(
  () => import("../features/integracoes/pages/IntegracoesBancariasPage")
);
const FolhaPagamentoPage = lazy(
  () => import("../features/folha/pages/FolhaPagamentoPage")
);

const withLoading = (node: React.ReactNode) => (
  <Suspense fallback={<PageLoading />}>{node}</Suspense>
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
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <DashboardPage />
          </RequireRole>
        ),
      },
      {
        path: "empresa",
        element: withLoading(
          <RequireRole allowedRoles={["EMPRESA"]}>
            <EmpresasPage />
          </RequireRole>
        ),
      },
      {
        path: "empresa/nova",
        element: withLoading(
          <RequireRole allowedRoles={["EMPRESA"]}>
            <CadastroEmpresaPage />
          </RequireRole>
        ),
      },
      {
        path: "empresa/:id",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ConfiguracaoEmpresaPage />
          </RequireRole>
        ),
      },
      {
        path: "receitas",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ReceitasTributacaoPage />
          </RequireRole>
        ),
      },
      {
        path: "caixa",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <CaixaTributacaoPage />
          </RequireRole>
        ),
      },
      {
        path: "conciliacao",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ConciliacaoTributacaoPage />
          </RequireRole>
        ),
      },
      {
        path: "financeiro/contas",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ContasBancariasPage />
          </RequireRole>
        ),
      },
      {
        path: "financeiro/contas/nova",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ContaBancariaPage />
          </RequireRole>
        ),
      },
      {
        path: "financeiro/contas/:id",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ContaBancariaPage />
          </RequireRole>
        ),
      },
      {
        path: "financeiro/contas-pagar",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ContasPagarPage />
          </RequireRole>
        ),
      },
      {
        path: "financeiro/contas-receber",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ContasReceberPage />
          </RequireRole>
        ),
      },
      {
        path: "financeiro/categorias",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <CategoriasFinanceirasPage />
          </RequireRole>
        ),
      },
      {
        path: "financeiro/movimentos",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <MovimentosCaixaPage />
          </RequireRole>
        ),
      },
      {
        path: "financeiro/caixa",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <CaixaPage />
          </RequireRole>
        ),
      },
      {
        path: "financeiro/prolabore",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ProlaborePage />
          </RequireRole>
        ),
      },
      {
        path: "fiscal/fechamento",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <FechamentoFiscalPage />
          </RequireRole>
        ),
      },
      {
        path: "fiscal/apuracao",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ApuracaoImpostosPage />
          </RequireRole>
        ),
      },
      {
        path: "fiscal/obrigacoes",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ObrigacoesPage />
          </RequireRole>
        ),
      },
      {
        path: "fiscal/notas",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <NotasListPage />
          </RequireRole>
        ),
      },
      {
        path: "fiscal/notas/nova",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <NotaNovaPage />
          </RequireRole>
        ),
      },
      {
        path: "fiscal/notas/:id",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <NotaDetalhePage />
          </RequireRole>
        ),
      },
      {
        path: "relatorios",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <RelatoriosPage />
          </RequireRole>
        ),
      },
      {
        path: "comercial/vendas",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <VendasPage />
          </RequireRole>
        ),
      },
      {
        path: "comercial/compras",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ComprasPage />
          </RequireRole>
        ),
      },
      {
        path: "cadastros/clientes",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ClientesPage />
          </RequireRole>
        ),
      },
      {
        path: "cadastros/fornecedores",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <FornecedoresPage />
          </RequireRole>
        ),
      },
      {
        path: "cadastros/produtos-servicos",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <ProdutosServicosPage />
          </RequireRole>
        ),
      },
      {
        path: "estoque",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <EstoquePage />
          </RequireRole>
        ),
      },
      {
        path: "integracoes/bancos",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <IntegracoesBancariasPage />
          </RequireRole>
        ),
      },
      {
        path: "folha",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <FolhaPagamentoPage />
          </RequireRole>
        ),
      },
      {
        path: "configuracoes/usuario",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <UsuarioConfigPage />
          </RequireRole>
        ),
      },

      // 404 dentro do layout (eu recomendo deixar ligado)

    ],
  },
]);
