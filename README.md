# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## API Contract

Base
- Base URL: `VITE_API_BASE_URL`
- Auth: `Authorization: Bearer <token>` (handled by `src/shared/services/apiClient.ts`)
- Dates: `YYYY-MM-DD`
- Competencia: `YYYY-MM`
- Currency: integer cents (UI divides by 100)

## Mock API (json-server)

Prereqs
- Install dependency: `npm install`
- Create `.env.local` with `VITE_API_BASE_URL=http://localhost:3001`

Run
- `npm run mock`
- `npm run dev`

Perfil
- `GET /usuarios/perfil`
- `PUT /usuarios/perfil`

Empresas
- `GET /empresas`
- `GET /empresas/:id`
- `POST /empresas`
- `PUT /empresas/:id`
- `DELETE /empresas/:id`

List response
```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 10, "total": 0 }
}
```

Tributacao
- `GET /tributacao/receitas`
- `GET /tributacao/receitas/:id`
- `POST /tributacao/receitas`
- `PUT /tributacao/receitas/:id`
- `DELETE /tributacao/receitas/:id`
- `GET /tributacao/caixa`
- `GET /tributacao/caixa/:id`
- `POST /tributacao/caixa`
- `PUT /tributacao/caixa/:id`
- `DELETE /tributacao/caixa/:id`
- `GET /tributacao/conciliacao`
- `GET /tributacao/conciliacao/:id`
- `POST /tributacao/conciliacao`
- `PUT /tributacao/conciliacao/:id`
- `DELETE /tributacao/conciliacao/:id`

Financeiro
- `GET /financeiro/contas-pagar`
- `GET /financeiro/contas-pagar/:id`
- `POST /financeiro/contas-pagar`
- `PUT /financeiro/contas-pagar/:id`
- `DELETE /financeiro/contas-pagar/:id`
- `GET /financeiro/contas-receber`
- `GET /financeiro/contas-receber/:id`
- `POST /financeiro/contas-receber`
- `PUT /financeiro/contas-receber/:id`
- `DELETE /financeiro/contas-receber/:id`
- `GET /financeiro/categorias`
- `GET /financeiro/categorias/:id`
- `POST /financeiro/categorias`
- `PUT /financeiro/categorias/:id`
- `DELETE /financeiro/categorias/:id`
- `GET /financeiro/contas`
- `GET /financeiro/contas/:id`
- `POST /financeiro/contas`
- `PUT /financeiro/contas/:id`
- `DELETE /financeiro/contas/:id`
- `GET /financeiro/movimentos`
- `GET /financeiro/movimentos/:id`
- `POST /financeiro/movimentos`
- `PUT /financeiro/movimentos/:id`
- `DELETE /financeiro/movimentos/:id`

Cadastros
- `GET /cadastros/clientes`
- `GET /cadastros/clientes/:id`
- `POST /cadastros/clientes`
- `PUT /cadastros/clientes/:id`
- `DELETE /cadastros/clientes/:id`
- `GET /cadastros/fornecedores`
- `GET /cadastros/fornecedores/:id`
- `POST /cadastros/fornecedores`
- `PUT /cadastros/fornecedores/:id`
- `DELETE /cadastros/fornecedores/:id`
- `GET /cadastros/produtos-servicos`
- `GET /cadastros/produtos-servicos/:id`
- `POST /cadastros/produtos-servicos`
- `PUT /cadastros/produtos-servicos/:id`
- `DELETE /cadastros/produtos-servicos/:id`

Comercial
- `GET /comercial/vendas`
- `GET /comercial/vendas/:id`
- `POST /comercial/vendas`
- `PUT /comercial/vendas/:id`
- `DELETE /comercial/vendas/:id`
- `GET /comercial/vendas/analytics`
- `GET /comercial/compras`
- `GET /comercial/compras/:id`
- `POST /comercial/compras`
- `PUT /comercial/compras/:id`
- `DELETE /comercial/compras/:id`

Estoque
- `GET /estoque`
- `GET /estoque/:id`
- `POST /estoque`
- `PUT /estoque/:id`
- `DELETE /estoque/:id`

Fiscal
- `GET /fiscal/apuracoes`
- `GET /fiscal/apuracoes/:id`
- `POST /fiscal/apuracoes`
- `PUT /fiscal/apuracoes/:id`
- `DELETE /fiscal/apuracoes/:id`
- `GET /fiscal/obrigacoes`
- `GET /fiscal/obrigacoes/:id`
- `POST /fiscal/obrigacoes`
- `PUT /fiscal/obrigacoes/:id`
- `DELETE /fiscal/obrigacoes/:id`

Notas
- `GET /notas`
- `GET /notas/:id`
- `POST /notas/draft`
- `POST /notas/draft/:id/emitir`

Integracoes
- `GET /integracoes/bancos`
- `GET /integracoes/bancos/:id`
- `POST /integracoes/bancos`
- `PUT /integracoes/bancos/:id`
- `DELETE /integracoes/bancos/:id`

Folha
- `GET /folha`
- `GET /folha/:id`
- `POST /folha`
- `PUT /folha/:id`
- `DELETE /folha/:id`
- `GET /folha/colaboradores`
- `GET /folha/colaboradores/:id`
- `POST /folha/colaboradores`
- `PUT /folha/colaboradores/:id`
- `DELETE /folha/colaboradores/:id`

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
