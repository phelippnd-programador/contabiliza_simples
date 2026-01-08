# Estoque - Modelo e Regras

Este documento resume o modelo de estoque, regras e endpoints usados no projeto.

## Modelo (resumo)

### Estoque
- id: string
- produtoId: string
- depositoId?: string
- quantidade: number
- quantidadeReservada?: number
- quantidadeDisponivel?: number
- custoMedio?: number
- estoqueMinimo?: number

### Movimentos
- id: string
- itemId: string
- depositoId?: string
- tipo: ENTRADA | SAIDA | AJUSTE
- quantidade: number
- custoUnitario?: number
- custoMedio?: number
- saldo?: number
- data: string (YYYY-MM-DD)
- lote?: string
- serie?: string
- origem?: MANUAL | VENDA | COMPRA
- origemId?: string
- observacoes?: string
- createdAt?: string (YYYY-MM-DDTHH:mm:ss)
- createdBy?: string
- dedupeKey?: string
- reversoDe?: string

### Depositos
- id: string
- nome: string
- ativo?: boolean
- observacoes?: string

## Regras essenciais

- Saldo negativo bloqueado por padrao (ajustes negativos exigem saldo suficiente).
- Movimentos idempotentes via `dedupeKey`.
- Auditoria via `createdAt` e `createdBy`.
- Estorno feito por movimento reverso com `reversoDe`.
- Custo medio calculado como media ponderada nas entradas.
- Reserva por pedido deve atualizar `quantidadeReservada` antes do faturamento.

## Endpoints (API)

- GET /estoque?page=1&pageSize=10&q=
- GET /estoque/{id}
- POST /estoque
- PUT /estoque/{id}
- DELETE /estoque/{id}
- GET /estoque/depositos
- POST /estoque/depositos
- PUT /estoque/depositos/{id}
- DELETE /estoque/depositos/{id}
- GET /estoque/{id}/movimentos?page=1&pageSize=10&dataInicio=2026-01-01&dataFim=2026-01-05&lote=...&serie=...&origem=...&depositoId=...
- POST /estoque/{id}/movimentos

## Mapeamento json-server (mock)

No mock, `page/pageSize` sao mapeados para `_page/_limit`.
Para filtros de data o mock aceita `dataInicio`/`dataFim` e mapeia internamente.

Exemplo no mock:
- GET /estoque/1/movimentos?page=1&pageSize=10&dataInicio=2026-01-01&dataFim=2026-01-05&lote=LOTE_001

## Exemplos de payload

### Criar movimento
{
  "tipo": "ENTRADA",
  "quantidade": 10,
  "custoUnitario": 1000,
  "data": "2026-01-05",
  "origem": "MANUAL",
  "observacoes": "Carga inicial"
}

### Estorno
{
  "tipo": "SAIDA",
  "quantidade": 10,
  "data": "2026-01-06",
  "origem": "MANUAL",
  "reversoDe": "mov_123"
}
