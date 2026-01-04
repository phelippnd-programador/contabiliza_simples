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
