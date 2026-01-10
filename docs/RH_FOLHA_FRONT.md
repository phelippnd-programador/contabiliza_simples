# RH/Folha (Frontend)

Modulo de RH/Folha criado apenas no frontend, pronto para integrar com backend Java/Spring.
Datas usam ISO `YYYY-MM-DD`. Valores monetarios sao `number` em reais e formatados na UI.

## Entidades
- Funcionario: dados pessoais, contrato, remuneracao, banco.
- Departamento, Cargo, CentroCusto: estrutura organizacional simples.
- CompetenciaFolha: `YYYY-MM` com status (ABERTA/EM_PROCESSAMENTO/FECHADA).
- EventoFolha: provento/desconto, incidencias INSS/FGTS/IRRF (flags).
- LancamentoFolha: evento aplicado por funcionario e competencia.
- PontoDia: entradas/saidas com total de horas.
- Ferias: periodo e status.
- Afastamento: tipo e periodo.

## Endpoints esperados (backend futuro)
- `GET /rh/funcionarios` + filtros/paginacao
- `GET /rh/funcionarios/{id}`
- `POST /rh/funcionarios`
- `PUT /rh/funcionarios/{id}`
- `PATCH /rh/funcionarios/{id}/status`
- `GET /rh/estrutura/departamentos`
- `POST /rh/estrutura/departamentos`
- `PUT /rh/estrutura/departamentos/{id}`
- `DELETE /rh/estrutura/departamentos/{id}`
- `GET /rh/estrutura/cargos`
- `POST /rh/estrutura/cargos`
- `PUT /rh/estrutura/cargos/{id}`
- `DELETE /rh/estrutura/cargos/{id}`
- `GET /rh/estrutura/centros-custo`
- `POST /rh/estrutura/centros-custo`
- `PUT /rh/estrutura/centros-custo/{id}`
- `DELETE /rh/estrutura/centros-custo/{id}`
- `GET /rh/folha/competencias`
- `POST /rh/folha/competencias`
- `PUT /rh/folha/competencias/{id}`
- `GET /rh/folha/eventos`
- `POST /rh/folha/eventos`
- `PUT /rh/folha/eventos/{id}`
- `DELETE /rh/folha/eventos/{id}`
- `GET /rh/folha/lancamentos`
- `POST /rh/folha/lancamentos`
- `DELETE /rh/folha/lancamentos/{id}`
- `GET /rh/ponto`
- `POST /rh/ponto`
- `DELETE /rh/ponto/{id}`
- `GET /rh/ferias`
- `POST /rh/ferias`
- `PUT /rh/ferias/{id}`
- `DELETE /rh/ferias/{id}`
- `GET /rh/afastamentos`
- `POST /rh/afastamentos`
- `PUT /rh/afastamentos/{id}`
- `DELETE /rh/afastamentos/{id}`

## Regras e limitacoes atuais
- Nao calcula INSS/IRRF real. Apenas estrutura de eventos e lancamentos.
- Holerite e print view sao apenas UI.
- Ponto tem calculo simples de horas.

## Exemplos de query
- `GET /rh/funcionarios?page=1&pageSize=10&status=ATIVO&dataInicio=2026-01-01&dataFim=2026-01-31`
- `GET /rh/folha/lancamentos?competencia=2026-01&page=1&pageSize=20`
- `GET /rh/ferias?page=1&pageSize=10&dataInicio=2026-02-01&dataFim=2026-02-28`

### Mapeamento json-server (dev)
- `page/pageSize` => `_page/_limit`
- `dataInicio/dataFim` => `{campo}_gte/{campo}_lte`
  - Funcionario: `dataAdmissao_gte` / `dataAdmissao_lte`
  - Ferias/Afastamentos: `inicio_gte` / `inicio_lte`
  - Ponto: `data_gte` / `data_lte`
