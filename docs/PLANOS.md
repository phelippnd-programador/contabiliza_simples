# Planos (Residential x Commercial)

Este projeto suporta dois planos: `RESIDENTIAL` e `COMMERCIAL`.

## Como funciona
- O plano fica persistido em `localStorage` (`app_plan`).
- O menu e as rotas sao filtrados por modulo.
- Textos principais (menu e Folha/Pagamentos) sao ajustados pelo plano.

## Onde ajustar
- Tipos: `src/app/plan/types.ts`
- Config: `src/app/plan/planConfig.ts`
- Guard de rota: `src/components/layout/auth/PlanRouteGuard.tsx`
- Seletor de plano: `src/components/layout/header/AppHeader.tsx`

## Como adicionar um novo modulo
1. Adicione o modulo em `PlanModule` (`src/app/plan/types.ts`).
2. Configure `enabledModules` para cada plano em `src/app/plan/planConfig.ts`.
3. Marque o item do menu com `moduleKey`.
4. Proteja as rotas usando `PlanRouteGuard` no `src/app/router.tsx`.

## Como ajustar labels por plano
- Edite `labels` em `src/app/plan/planConfig.ts`.
- Use `getPlanConfig(plan).labels` nas telas.
