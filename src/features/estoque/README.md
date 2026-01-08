# Modulo de Estoque

## Endpoints

### `GET /estoque`
Lista o inventario com paginacao.

- Query params:
  - `page` (padrao `1`)
  - `pageSize` (padrao `10`)
  - `q` (busca por descricao/item)

### `GET /estoque/:id`
Retorna o item detalhado (mesmos campos do inventario).

### `POST /estoque/:id/movimentos`
Registra entrada, saida ou ajuste.

### `GET /estoque/:id/movimentos`
Retorna os movimentos por item.

### `GET /estoque/movimentos`
Retorna o historico completo filtravel.

### `GET /estoque/depositos`
Lista depositos.

### `POST /estoque/depositos`
Cria deposito.

### `PUT /estoque/depositos/:id`
Atualiza deposito.

### `DELETE /estoque/depositos/:id`
Remove deposito.

## Mock local (json-server)

O mock usa `mock/db.json` como base de dados com json-server (ver `mock/server.cjs`).
Para simular filtros/paginacao, utilize os query params descritos acima.
