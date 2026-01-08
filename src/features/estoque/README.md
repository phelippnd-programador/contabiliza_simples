# Módulo de Estoque

## Endpoints

### `GET /estoque`
Lista o inventário com paginação.

- **Query params**:
  - `page` (padrão `1`)
  - `pageSize` (padrão `10`)
  - `q` (busca por descrição/item)

- **Resposta**:
  ```json
  {
    "data": [
      {
        "id": "1",
        "produtoId": "SKU_0001",
        "descricao": "Teste",
        "item": null,
        "quantidade": 100,
        "custoMedio": 20000,
        "estoqueMinimo": 10
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 10,
      "total": 1
    }
  }
  ```

### `GET /estoque/:id`
Retorna o item detalhado (mesmos campos do inventário). Utilizado para visualizar o saldo atual no formulário de movimentos.

### `POST /estoque/:id/movimentos`
Registra entrada, saída ou ajuste.

- **Payload**:
  ```json
  {
    "tipo": "ENTRADA",
    "quantidade": 10,
    "data": "2026-01-10",
    "custoUnitario": 1000,
    "lote": "LOTE_005",
    "serie": "005",
    "origem": "MANUAL",
    "origemId": null,
    "observacoes": "Teste"
  }
  ```

### `GET /estoque/:id/movimentos`
Retorna os movimentos por item.

### `GET /estoque/movimentos`
Se nenhum `itemId` é passado, retorna o histórico completo filtrável pelo query string:

- `data_gte`, `data_lte`, `origem`, `lote`, `serie`

## Mock local (mock/ routes e db)

O mock usa `mock/db.json` como base de dados. As funções em `src/features/estoque/utils/estoque.mock.ts` simulam o mesmo contrato e expõem:

- leitura paginada (`page`, `pageSize`)
- filtros de texto (`q`) e meta (`total`)
- filtros de movimentos (data, origem, lote, série)
- cada movimento possui: `id`, `itemId`, `tipo`, `quantidade`, `custoUnitario`, `data`, `lote`, `serie`, `saldo`, `origem`

Use-as para testar sem backend e garantir que o contrato HTTP não mudou.
