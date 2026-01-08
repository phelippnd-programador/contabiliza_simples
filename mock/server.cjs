const path = require("path");
const jsonServer = require("json-server");

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db.json"));
const middlewares = jsonServer.defaults();
const routes = require("./routes.json");
const port = Number(process.env.MOCK_PORT || process.env.PORT || 3001);

server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use((req, _res, next) => {
  const url = new URL(req.originalUrl, `http://${req.headers.host}`);
  const page = url.searchParams.get("page");
  const pageSize = url.searchParams.get("pageSize");
  const dataInicio = url.searchParams.get("dataInicio");
  const dataFim = url.searchParams.get("dataFim");
  const origem = url.searchParams.get("origem");
  const lote = url.searchParams.get("lote");
  const serie = url.searchParams.get("serie");
  const depositoId = url.searchParams.get("depositoId");

  if (page || pageSize) {
    req.query = req.query || {};
    req._pagination = {
      page: Number(page || 1),
      pageSize: Number(pageSize || 10),
    };
    if (page) req.query._page = page;
    if (pageSize) req.query._limit = pageSize;
    delete req.query.page;
    delete req.query.pageSize;

    if (dataInicio) req.query.dataInicio = dataInicio;
    if (dataFim) req.query.dataFim = dataFim;
    if (origem) req.query.origem = origem;
    if (lote) req.query.lote = lote;
    if (serie) req.query.serie = serie;
    if (depositoId) req.query.depositoId = depositoId;

    req.url = url.pathname;
    req.originalUrl = url.pathname;
  }

  next();
});
server.use(jsonServer.rewriter(routes));

const buildToken = (prefix) => `${prefix}-${Date.now()}`;

server.post("/auth/login", (req, res) => {
  res.json({
    accessToken: buildToken("mock-access"),
    refreshToken: buildToken("mock-refresh"),
    role: "CONTADOR",
  });
});

server.post("/auth/refresh", (req, res) => {
  res.json({
    accessToken: buildToken("mock-access"),
    refreshToken: req.body?.refreshToken || buildToken("mock-refresh"),
    role: "CONTADOR",
  });
});

server.get("/auth/me", (req, res) => {
  res.json({ role: "CONTADOR" });
});

server.get("/estoque/:id/movimentos", (req, res, next) => {
  if (!router?.db) {
    next();
    return;
  }
  const itemId = String(req.params.id);
  const dataInicio = req.query?.dataInicio ? String(req.query.dataInicio) : "";
  const dataFim = req.query?.dataFim ? String(req.query.dataFim) : "";
  const origem = req.query?.origem ? String(req.query.origem) : "";
  const lote = req.query?.lote ? String(req.query.lote) : "";
  const serie = req.query?.serie ? String(req.query.serie) : "";
  const depositoId = req.query?.depositoId ? String(req.query.depositoId) : "";
  const all = router.db.get("estoqueMovimentos").value() || [];
  let filtered = all.filter((mov) => String(mov.itemId) === itemId);
  if (dataInicio) filtered = filtered.filter((mov) => mov.data >= dataInicio);
  if (dataFim) filtered = filtered.filter((mov) => mov.data <= dataFim);
  if (origem) filtered = filtered.filter((mov) => mov.origem === origem);
  if (lote) filtered = filtered.filter((mov) => mov.lote === lote);
  if (serie) filtered = filtered.filter((mov) => mov.serie === serie);
  if (depositoId) filtered = filtered.filter((mov) => String(mov.depositoId) === depositoId);

  const page = Number(req.query?._page ?? req.query?.page ?? 1);
  const pageSize = Number(req.query?._limit ?? req.query?.pageSize ?? filtered.length ?? 10);
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  res.jsonp({
    data,
    meta: { page, pageSize, total: filtered.length },
  });
});

server.post("/estoque/:id/movimentos", (req, res, next) => {
  if (!router?.db) {
    next();
    return;
  }
  const itemId = String(req.params.id);
  const payload = req.body || {};
  const movimentos = router.db.get("estoqueMovimentos");
  const estoque = router.db.get("estoque");
  const depositoId = payload.depositoId ? String(payload.depositoId) : "";
  const item = depositoId
    ? estoque.find({ produtoId: itemId, depositoId }).value()
    : estoque.find({ produtoId: itemId }).value() || estoque.find({ id: Number(itemId) }).value();
  if (!item) {
    res.status(404).jsonp({ error: "ITEM_NOT_FOUND" });
    return;
  }

  if (payload.dedupeKey) {
    const existing = movimentos
      .find({ itemId, dedupeKey: payload.dedupeKey })
      .value();
    if (existing) {
      res.jsonp(existing);
      return;
    }
  }

  const quantidade = Number(payload.quantidade ?? 0);
  if (!quantidade) {
    res.status(400).jsonp({ error: "INVALID_QUANTITY" });
    return;
  }
  const tipo = payload.tipo;
  const signed =
    tipo === "SAIDA"
      ? -Math.abs(quantidade)
      : tipo === "ENTRADA"
      ? Math.abs(quantidade)
      : quantidade;
  const saldoAtual = Number(item.quantidade ?? 0);
  const novoSaldo = saldoAtual + signed;
  if (novoSaldo < 0) {
    res.status(400).jsonp({ error: "NEGATIVE_STOCK" });
    return;
  }

  let custoMedio = Number(item.custoMedio ?? 0);
  if (signed > 0) {
    const custoUnitario = Number(payload.custoUnitario ?? 0);
    if (!custoUnitario) {
      res.status(400).jsonp({ error: "COST_REQUIRED" });
      return;
    }
    const totalAtual = saldoAtual * custoMedio;
    const totalMovimento = signed * custoUnitario;
    custoMedio = Math.round((totalAtual + totalMovimento) / (saldoAtual + signed));
  }

  const lastId = movimentos.value().reduce((max, mov) => Math.max(max, Number(mov.id) || 0), 0);
  const createdAt = payload.createdAt || new Date().toISOString();
  const createdBy = payload.createdBy || "Sistema";
  const novoMovimento = {
    id: lastId + 1,
    itemId,
    tipo,
    quantidade: Math.abs(quantidade),
    custoUnitario: payload.custoUnitario ?? undefined,
    custoMedio,
    saldo: novoSaldo,
    data: payload.data,
    lote: payload.lote ?? undefined,
    serie: payload.serie ?? undefined,
    origem: payload.origem ?? "MANUAL",
    origemId: payload.origemId ?? undefined,
    observacoes: payload.observacoes ?? undefined,
    createdAt,
    createdBy,
    dedupeKey: payload.dedupeKey ?? undefined,
    reversoDe: payload.reversoDe ?? undefined,
    depositoId: payload.depositoId ?? undefined,
  };

  movimentos.push(novoMovimento).write();
  estoque
    .find({ id: item.id })
    .assign({ quantidade: novoSaldo, custoMedio })
    .write();

  res.status(201).jsonp(novoMovimento);
});

server.post("/notas/draft", (req, res) => {
  const itens = Array.isArray(req.body?.itens) ? req.body.itens : [];
  const total = itens.reduce(
    (acc, item) => acc + Number(item.valorUnitario || 0) * Number(item.quantidade || 1),
    0
  );
  res.json({
    draftId: `draft_${Date.now()}`,
    status: "RASCUNHO",
    preview: { total, impostosEstimados: [] },
    faltando: [],
  });
});

server.post("/notas/draft/:id/emitir", (req, res) => {
  res.json({
    notaId: `nota_${Date.now()}`,
    status: "EMITIDA",
    numero: "1",
    serie: "1",
    chave: `NFE${Date.now()}`,
    urlPdf: "",
    urlXml: "",
  });
});

router.render = (req, res) => {
  const data = res.locals.data;
  if (!Array.isArray(data)) {
    res.jsonp(data);
    return;
  }
  const pagination = req._pagination;
  if (pagination) {
    const total = Number(res.getHeader("X-Total-Count") ?? data.length);
    res.jsonp({
      data,
      meta: { page: pagination.page, pageSize: pagination.pageSize, total },
    });
    return;
  }
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? data.length);
  const start = (page - 1) * pageSize;
  const sliced = data.slice(start, start + pageSize);
  res.jsonp({
    data: sliced,
    meta: { page, pageSize, total: data.length },
  });
};

server.use(router);

server.listen(port, () => {
  console.log(`json-server mock listening on http://localhost:${port}`);
});
