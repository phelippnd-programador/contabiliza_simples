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
const TributacaoPage = lazy(() => import("../features/tributacao/pages/TributacaoPage"));
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
        path: "empresa",
        element: withLoading(
          <RequireRole allowedRoles={["EMPRESA"]}>
            <CadastroEmpresaPage />
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
            <ContaBancariaPage />
          </RequireRole>
        ),
      },
      {
        path: "caixa",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <TributacaoPage />
          </RequireRole>
        ),
      },
      {
        path: "conciliacao",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <TributacaoPage />
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
        path: "relatorios",
        element: withLoading(
          <RequireRole allowedRoles={["CONTADOR", "EMPRESA"]}>
            <RelatoriosPage />
          </RequireRole>
        ),
      },

      // 404 dentro do layout (eu recomendo deixar ligado)

    ],
  },
]);
