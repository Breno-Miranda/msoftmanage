# Source Tree — m-manage

```
m-manage/
├── src/
│   ├── index.ts                    # Entry point (bun src/index.ts)
│   ├── app.ts                      # App alternativo (legado, manter sincronizado)
│   ├── config/
│   │   ├── mongo.ts                # connectMongo()
│   │   ├── redis.ts                # cache wrapper (graceful)
│   │   └── database.ts             # singleton status
│   ├── models/
│   │   ├── mAuth.ts                # Usuários/autenticação
│   │   ├── mApps.ts                # Aplicações instaladas
│   │   ├── mCatalog.ts             # Catálogo de produtos/serviços
│   │   ├── mProduct.ts             # Produtos unificados multi-app (S001)
│   │   ├── mErp.ts                 # ERP insumos/produtos/kardex (S002)
│   │   ├── mLogs.ts                # Logs do sistema
│   │   ├── mTask.ts                # Tarefas
│   │   ├── mJson.ts                # JSON key-value storage
│   │   ├── mBlogs.ts               # Blog posts
│   │   ├── mContent.ts             # Conteúdo dinâmico
│   │   ├── mCredential.ts          # Credenciais/API keys
│   │   ├── mLeads.ts               # Leads/contatos
│   │   ├── mRestaurantMenuCategory.ts   # Restaurante: categorias do cardápio (S021)
│   │   ├── mRestaurantMenuItem.ts       # Restaurante: itens do cardápio (S021)
│   │   ├── mRestaurantIngredient.ts     # Restaurante: ingredientes/estoque (S021)
│   │   ├── mRestaurantTable.ts          # Restaurante: mesas (S021)
│   │   ├── mRestaurantOrder.ts          # Restaurante: pedidos/comandas (S021)
│   │   └── healthtech/             # Módulo Farmácia 4.0
│   ├── modules/
│   │   ├── users/                  # CRUD usuários + backup Cassandra
│   │   ├── mLeadsRequest/          # Requisições de leads
│   │   ├── products/               # Produtos unificados (S001)
│   │   │   ├── index.ts
│   │   │   └── product.controller.ts
│   │   ├── erp/                    # ERP multi-app (S002)
│   │   │   ├── index.ts
│   │   │   └── erp.controller.ts
│   │   └── restaurant/             # Gestão de restaurantes (S021)
│   │       ├── index.ts
│   │       ├── restaurant.controller.ts
│   │       └── services/           # Serviços do módulo restaurante
│   │           ├── stock.service.ts
│   │           ├── order.service.ts
│   │           └── report.service.ts
│   ├── routes/
│   │   ├── auth.ts                 # POST /auth/login, /register
│   │   ├── apps.ts                 # GET/POST /apps
│   │   ├── catalog.ts              # GET/POST /catalog
│   │   ├── credentials.ts          # CRUD /credentials
│   │   ├── blogs.ts                # CRUD /blogs
│   │   ├── content.ts              # CRUD /content
│   │   ├── logs.ts                 # CRUD /logs
│   │   ├── tasks.ts                # CRUD /tasks
│   │   ├── mjson.ts                # GET/POST /mjson
│   │   └── healthtech.ts           # Módulo Farmácia 4.0
│   ├── services/
│   │   └── backup.service.ts       # Cassandra backup (fire-and-forget)
│   └── types/
│       └── index.ts                # Interfaces globais
├── docs/
│   ├── stories/                    # SDD AIOX — S<NNN>-titulo.md
│   │   ├── S001-unified-products.md
│   │   ├── S002-bva-integration.md
│   │   └── backlog/                # Stories futuras
│   ├── framework/
│   │   ├── tech-stack.md
│   │   ├── coding-standards.md
│   │   └── source-tree.md
│   └── qa/                         # Relatórios de QA
├── .aiox-core/                     # Framework AIOX v5.2.9
├── .aiox/                          # Estado do projeto AIOX
├── .ai/                            # Logs de decisão ADR
├── tests/                          # Testes Bun
├── .env                            # Variáveis locais (não versionar)
├── docker-compose.dev.yml          # MongoDB + API + Mongo Express
├── package.json                    # bun-mongodb-api v0.10.40
└── tsconfig.json
```

## Endpoints ativos
| Prefixo | Módulo |
|---------|--------|
| `/auth` | authRoutes |
| `/users` | userRoutes |
| `/apps` | appRoutes |
| `/catalog` | catalogRoutes |
| `/credentials` | credentialRoutes |
| `/healthtech` | healthtechRoutes |
| `/tasks` | taskRoutes |
| `/blogs` | blogRoutes |
| `/content` | contentRoutes |
| `/logs` | logRoutes |
| `/leads` | mLeadsRequestRoutes |
| `/products` | productRoutes (S001) |
| `/erp` | erpRoutes (S002) |
| `/restaurant` | restaurantRoutes (S021) |
| `/mjson` | mjsonRoutes |
