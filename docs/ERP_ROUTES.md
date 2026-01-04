# Rotas e campos do ERP

Este documento lista as rotas ativas em `src/app/router.tsx`, descreve o objetivo de cada tela e explica o uso dos campos e regras de negocio visiveis no front.

Observacoes gerais
- Quando `VITE_API_BASE_URL` nao esta configurado, algumas telas usam simuladores locais (localStorage): receitas, caixa, conciliacao, apuracao de impostos, obrigacoes e folha (simulador e listagem).
- Campos de endereco usam `AppEndereco`, que busca CEP e preenche logradouro, bairro, cidade, UF, codigo IBGE e pais quando possivel.
- Valores monetarios sao armazenados em centavos nas telas que usam `formatBRL` (ex: 100 = R$ 1,00).

## Rotas publicas

### `/login`
Tela de autenticacao.
Campos
- Email: identificador de acesso (obrigatorio).
- Senha: senha da conta (obrigatorio).

### `/esqueci-senha`
Recuperacao de acesso.
Campos
- Email: recebe link de redefinicao (obrigatorio).

## Dashboard

### `/`
Visao geral do financeiro.
Campos
- Data inicial: filtro do grafico de fluxo de caixa.
- Data final: filtro do grafico de fluxo de caixa.

## Empresas

### `/empresa`
Lista de empresas.
Campos (filtro e tabela)
- Razao social, Nome fantasia, CNPJ: colunas de lista.

### `/empresa/nova`
Cadastro de empresa.
Campos
- Razao social: identificacao legal (obrigatorio).
- Nome fantasia: nome comercial (obrigatorio).
- CNPJ: documento fiscal (14 digitos, obrigatorio).
- Inscricao estadual: dado fiscal estadual.
- Regime tributario: define regras fiscais (obrigatorio).
- RBT12: receita bruta dos ultimos 12 meses (obrigatorio no Simples).
- Anexo do Simples: tabela do Simples (obrigatorio no Simples).
- Percentual Fator R: necessario no Simples Anexo III/V.
- CNAE principal: atividade principal (7 digitos, obrigatorio).
- Telefone: contato (obrigatorio).
- Email: contato (obrigatorio).
Regras
- CNPJ deve ter 14 digitos numericos.
- CNAE principal deve ter 7 digitos numericos.
- Regime Simples exige Anexo e RBT12; Anexo III/V exige Fator R.

### `/empresa/:id`
Configuracao da empresa (abas).

Aba "Dados da Empresa"
- Razao social: identificacao legal (obrigatorio).
- Nome fantasia: nome comercial (obrigatorio).
- CNPJ: exibido somente leitura.
- Inscricao estadual: dado fiscal estadual.

Aba "Endereco & Contato"
- Email: contato principal (obrigatorio).
- Telefone: contato principal (>= 10 digitos).
- Endereco (AppEndereco): CEP, logradouro, numero, complemento, bairro, cidade, UF, codigo IBGE, pais.
Regras
- CEP 8 digitos.
- UF 2 letras.

Aba "Fiscal / Tributacao"
- CNAE principal: atividade principal (obrigatorio).
- CNAEs secundarios: atividades complementares (opcional, sem duplicidade).
- Regime tributario: obrigatorio.
- RBT12: receita bruta 12m (obrigatorio no Simples).
- Anexo do Simples: obrigatorio no Simples.
- Percentual Fator R: obrigatorio no Anexo III/V.

Aba "Financeiro"
- A empresa possui pro-labore: habilita configuracao.
- Valor do pro-labore: valor mensal (obrigatorio quando habilitado).
- Dia de pagamento: 1 a 28 (obrigatorio quando habilitado).
- Conta de pagamento: conta bancaria usada no pagamento.
- Categoria do pro-labore: categoria financeira de saida.
- Gerar lancamento automatico de INSS: habilita campos de INSS.
- Percentual do INSS: percentual aplicado (0 a 100).
- Categoria do INSS: categoria financeira para o INSS.
Regras
- Campos de pro-labore sao obrigatorios quando "temProlabore" esta ativo.
- Categoria do INSS obrigatoria quando gerar INSS esta ativo.

## Cadastros

### `/cadastros/clientes`
Cadastro de clientes.
Campos
- Nome: identificacao do cliente (obrigatorio).
- CPF/CNPJ: documento fiscal (obrigatorio).
- Tipo pessoa: PF ou PJ.
- Email e telefone: contato.
- Nome fantasia (PJ): nome comercial.
- Inscricao estadual (PJ): IE do cliente.
- Inscricao municipal (PJ): IM do cliente.
- Indicador IE (PJ): contribuinte / isento / nao contribuinte.
- Endereco (AppEndereco): CEP, logradouro, numero, complemento, bairro, cidade, UF, codigo IBGE, pais.
- Status: ativo/inativo.
Regras
- Documento obrigatorio: 11 digitos para PF, 14 digitos para PJ.
- Para PJ: IE obrigatoria se indicador = contribuinte; IE proibida se isento/nao contribuinte.
- Para PF: IE/IM nao se aplicam.
- UF obrigatoria para validar IE/IM.
- Codigo IBGE obrigatorio quando UF + cidade preenchidos.

### `/cadastros/fornecedores`
Cadastro de fornecedores (mesmas regras de cliente).
Campos
- Nome, CPF/CNPJ, tipo pessoa, email, telefone.
- Nome fantasia (PJ).
- Inscricao estadual/municipal (PJ).
- Indicador IE (PJ).
- Endereco (AppEndereco).
- Status.
Regras
- Documento e regras de IE/IM iguais ao cadastro de clientes.

### `/cadastros/produtos-servicos`
Cadastro de produtos e servicos.
Campos
- Descricao: nome do item (obrigatorio).
- Codigo interno: identificador interno.
- Tipo: PRODUTO ou SERVICO.
- Unidade: unidade de medida (obrigatorio).
- Valor unitario: preco base (obrigatorio, > 0).
- NCM (produto): classificacao fiscal.
- CFOP (produto): natureza da operacao.
- CNAE (servico): classificacao fiscal.
- Codigo do servico (servico): codigo municipal/tributario.
- Status: ativo/inativo.
Regras
- Produto exige NCM e CFOP.
- Servico exige CNAE.

## Comercial

### `/comercial/vendas`
Registro de vendas.
Campos
- Cliente: referencia ao cadastro (obrigatorio).
- Data: data da venda (obrigatorio).
- Status: ABERTA, APROVADA, FATURADA, CANCELADA.
- Itens: catalogo, descricao, quantidade, valor unitario, total.
- Desconto, frete, impostos: ajustes em centavos.
- Subtotal e total: calculados automaticamente.
- Observacoes: anotacoes gerais.
- Gerar contas a receber: SIM/NAO.
- Conta, categoria, vencimento, forma de pagamento: obrigatorios quando gerar conta = SIM.
- Movimentar estoque: SIM/NAO.
Regras
- Itens exigem descricao, quantidade > 0 e valor unitario > 0.
- Quando gerar contas a receber = SIM, conta e categoria sao obrigatorias.
- Quando movimentar estoque = SIM, gera saidas de estoque por item.

### `/comercial/compras`
Registro de compras.
Campos
- Fornecedor: referencia ao cadastro (obrigatorio).
- Data: data da compra (obrigatorio).
- Status: ABERTA, APROVADA, RECEBIDA, CANCELADA.
- Itens: catalogo, descricao, quantidade, valor unitario, total.
- Desconto, frete, impostos: ajustes em centavos.
- Subtotal e total: calculados automaticamente.
- Observacoes.
- Gerar contas a pagar: SIM/NAO.
- Conta, categoria, vencimento, forma de pagamento: obrigatorios quando gerar conta = SIM.
- Movimentar estoque: SIM/NAO.
Regras
- Itens exigem descricao, quantidade > 0 e valor unitario > 0.
- Quando gerar contas a pagar = SIM, conta e categoria sao obrigatorias.
- Quando movimentar estoque = SIM, gera entradas com custo unitario.

### `/comercial/vendas/analytics`
Analise de vendas.
Campos
- Data inicial e Data final: filtros.
Saidas
- Estatisticas de quantidade, total e ranking de produtos.

## Financeiro

### `/financeiro/contas`
Lista de contas bancarias.
Campos (tabela)
- Nome, banco, agencia, conta, digito.

### `/financeiro/contas/nova`
### `/financeiro/contas/:id`
Cadastro/edicao de conta.
Campos
- Nome da conta: identificacao (obrigatorio).
- Banco: nome do banco (obrigatorio).
- Agencia: numero (obrigatorio).
- Conta: numero (obrigatorio).
- Digito: digito verificador.
- Tipo: BANCO/CORRENTE/POUPANCA (conforme opcoes).
- Categoria: ENTRADA ou SAIDA.

### `/financeiro/categorias`
Cadastro de categorias financeiras.
Campos
- Nome: nome da categoria (obrigatorio).
- Tipo: entrada ou saida (obrigatorio).

### `/financeiro/movimentos`
Lancamento de caixa.
Campos
- Data: data do movimento (obrigatorio).
- Conta: conta bancaria (obrigatorio).
- Tipo: entrada/saida (obrigatorio).
- Valor: valor em centavos (obrigatorio, > 0).
- Categoria: categoria financeira (obrigatorio).
- Descricao: anotacao.
- Competencia: mes/ano.
- CNAE: opcional, vincula o movimento a um CNAE.

### `/financeiro/caixa`
Visao de caixa com filtros.
Campos
- Data inicial, Data final: periodo.
- Conta: filtro por conta.
- Categoria: filtro por categoria.
Saidas
- Saldo por conta e lista de movimentos filtrados.

### `/financeiro/contas-pagar`
Contas a pagar.
Campos
- Fornecedor: referencia ao cadastro (obrigatorio).
- Titulo: descricao do titulo (obrigatorio).
- Documento: numero do documento.
- Competencia: mes/ano.
- Parcela, Total parcelas: controle de parcelamento.
- Vencimento: data limite (obrigatorio).
- Valor do titulo: base (obrigatorio, > 0).
- Desconto, juros, multa: ajustes.
- Valor liquido: calculado.
- Status: ABERTA, PAGA, CANCELADA.
- Pagamento: data do pagamento.
- Valor pago: valor efetivamente pago.
- Forma de pagamento: PIX/DINHEIRO/CARTAO/BOLETO/TRANSFERENCIA.
- Conta: conta de pagamento.
- Categoria: categoria financeira.
- Observacoes: anotacoes.
Regras
- Se status = PAGA, data de pagamento e valor pago sao obrigatorios.

### `/financeiro/contas-receber`
Contas a receber.
Campos
- Cliente: referencia ao cadastro (obrigatorio).
- Titulo: descricao do titulo (obrigatorio).
- Documento: numero do documento.
- Competencia: mes/ano.
- Parcela, Total parcelas.
- Vencimento: data limite (obrigatorio).
- Valor do titulo: base (obrigatorio, > 0).
- Desconto, juros, multa: ajustes.
- Valor liquido: calculado.
- Status: ABERTA, RECEBIDA, CANCELADA.
- Recebimento: data do recebimento.
- Valor recebido: valor efetivamente recebido.
- Forma de pagamento, Conta, Categoria, Observacoes.
Regras
- Se status = RECEBIDA, data de recebimento e valor recebido sao obrigatorios.

### `/financeiro/prolabore`
Execucao do pro-labore.
Campos
- Competencia: mes/ano.
- Data: data do lancamento (obrigatorio).
- Conta: conta bancaria (obrigatorio).
- Valor pro-labore: valor base (obrigatorio, > 0).
- Categoria pro-labore: categoria financeira (obrigatorio).
- Gerar INSS: habilita campos de INSS.
- Percentual INSS: percentual aplicado.
- Categoria INSS: categoria financeira do INSS.
Regras
- Se gerar INSS = sim, percentual e categoria do INSS sao obrigatorios.

## Estoque

### `/estoque`
Cadastro de itens em estoque.
Campos
- Item: referencia ao cadastro de produto/servico (obrigatorio).
- Quantidade: saldo atual (obrigatorio, > 0).
- Custo medio: custo medio em centavos.
- Estoque minimo: limite para alerta.

### `/estoque/movimentos`
Movimentos de estoque.
Campos
- Item: referencia ao produto/servico.
- Tipo: ENTRADA, SAIDA, AJUSTE.
- Data: data do movimento (obrigatorio).
- Quantidade: qtd movimentada (obrigatorio, > 0).
- Custo unitario: obrigatorio para ENTRADA.
- Lote: controle de lote.
- Serie: controle de serie.
- Origem: MANUAL, VENDA, COMPRA.
- Referencia: id da origem (texto livre para MANUAL, select para VENDA/COMPRA).
- Observacoes: anotacoes.
Regras
- ENTRADA exige custo unitario.
- Exibe previsao de saldo e custo medio calculado.

### `/estoque/importacao`
Inventario por CSV.
Campos
- Arquivo CSV: colunas aceitas: itemId ou item, tipo, data, quantidade, custoUnitario, lote, serie, origem, origemId, observacoes.
Regras
- Item precisa existir no estoque.
- Data e quantidade sao obrigatorias.
- Fornece botao para baixar CSV base.

## Fiscal

### `/fiscal/fechamento`
Fechamento fiscal mensal.
Campos
- Competencia: mes/ano para consolidar receitas e calcular RBT12 e Fator R.
Saidas
- Receita por CNAE, RBT12, Fator R.

### `/fiscal/apuracao`
Apuracao de impostos e geracao de guias.
Campos (simulador)
- Competencia: mes/ano.
- Guia: DAS ou DARF.
- Base (receita): valor base.
- Aliquota (%): percentual.
- Vencimento: data da guia (auto sugerido se vazio).
- Valor calculado: calculado.
Campos (cadastro manual)
- Competencia, Tributo, Valor, Vencimento, Status.
Regras
- Competencia, tributo e valor sao obrigatorios no cadastro manual.

### `/fiscal/obrigacoes`
Calendario de obrigacoes.
Campos (simulador)
- Competencia: mes/ano.
- Regime: SIMPLES, LUCRO_PRESUMIDO, LUCRO_REAL.
Campos (cadastro manual)
- Obrigacao: nome da obrigacao.
- Vencimento: data limite.
- Status: PENDENTE, ENVIADA, ATRASADA.

### `/fiscal/notas`
Lista de notas fiscais.
Campos (filtro)
- Competencia: mes/ano.
- Status: rascunho, invalido, emitida, erro, cancelada.

### `/fiscal/notas/nova`
Cadastro e emissao de nota fiscal.
Campos
- Empresa: empresa emissora (obrigatorio).
- Tipo: SERVICO ou PRODUTO (obrigatorio).
- Competencia: mes/ano (obrigatorio).
- Data de emissao: opcional.
- Tomador: nome/razao, CPF/CNPJ, email, telefone, endereco.
- Itens: descricao, quantidade, valor unitario, codigo do servico, CNAE (servico) ou NCM/CFOP (produto).
- Financeiro: gerar movimento de caixa, conta, categoria, data de recebimento, forma de pagamento.
- Observacoes: texto livre.
Regras (schema)
- Documento do tomador deve ter 11 ou 14 digitos numericos.
- UF deve ter 2 letras; codigo IBGE deve ter 7 digitos quando informado.
- Itens exigem descricao e valor unitario > 0.
- Para PRODUTO: NCM e CFOP sao obrigatorios.

### `/fiscal/notas/:id`
Detalhe da nota.
Campos exibidos
- Status, Numero, Serie, Chave.
- Links para PDF/XML quando fornecidos.
- Erro detalhado quando status = ERRO.

## Tributacao

### `/receitas`
Receitas tributarias.
Campos
- Competencia: mes/ano.
- Origem: descricao.
- Valor: valor em centavos.
- Status: ABERTA, APURADA, CANCELADA.
Regras
- Competencia e valor sao obrigatorios.

### `/caixa`
Caixa tributario.
Campos
- Competencia: mes/ano.
- Conta: descricao da conta.
- Valor: valor em centavos.
- Status: ABERTO, FECHADO, CANCELADO.
Regras
- Competencia, conta e valor sao obrigatorios.

### `/conciliacao`
Conciliacao tributaria.
Campos
- Data: data do evento.
- Conta: descricao da conta.
- Valor: valor em centavos.
- Status: PENDENTE, CONCILIADA, CANCELADA.
Regras
- Data, conta e valor sao obrigatorios.

## Integracoes

### `/integracoes/bancos`
Integracoes bancarias.
Campos
- Banco: selecao de banco/provedor (obrigatorio).
- Status: ATIVA/INATIVA.
- Ultima atualizacao: informativo.

## Folha

### `/folha`
Folha de pagamento (resumo).
Campos
- Referencia: mes/ano (obrigatorio).
- Colaboradores: quantidade (obrigatorio, > 0).
- Status: ABERTA, FECHADA, CANCELADA.

### `/folha/simulador`
Simulador de folha.
Campos
- Referencia: mes/ano.
- Colaboradores: quantidade.
- Salario base, horas extras, outros proventos.
- Descontos, dependentes.
- INSS, IRRF, FGTS (%).
- Rescisao: tipo.
- Verbas rescisorias.
Saidas
- Resumo calculado de proventos, descontos, liquido e encargos.
- Eventos eSocial: S-1200, S-1210 e S-2299 (quando ha rescisao).

### `/folha/colaboradores`
Cadastro de colaboradores.
Campos
- Nome, CPF/CNPJ, tipo colaborador (CLT, PJ, etc).
- Email, telefone, cargo.
- PIS (somente CLT).
- Admissao (CLT/estagiario) e demissao.
- Categoria INSS (obrigatorio quando nao PJ).
- Salario base (obrigatorio quando nao PJ).
- Percentual INSS (quando aplicavel).
- Endereco (AppEndereco).
- Status.
Regras
- Nome e documento obrigatorios.
- Categoria INSS e salario base obrigatorios para tipos nao PJ.
- Admissao obrigatoria para CLT e estagiario.

## Relatorios

### `/relatorios`
Relatorios financeiros.
Campos
- Data inicial, Data final: periodo.
- Conta: filtro por conta.
Saidas
- Resumo de entradas, saidas e saldo.
- Despesas por categoria.
- Receita por CNAE.

## Configuracoes do usuario

### `/configuracoes/usuario`
Configuracao do usuario.
Campos
- Nome, email, telefone.
- Foto (upload, drag and drop, ou camera).
- Senha atual, nova senha, confirmacao.
Regras
- Nome e email obrigatorios.
- Se alterar senha: senha atual obrigatoria, nova senha >= 8, confirmacao deve bater.

## Rotas de erro

### `/403`
Acesso negado.

### `*`
Pagina nao encontrada (404).
