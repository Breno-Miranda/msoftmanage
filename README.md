# API REST com Bun + MongoDB + ElysiaJS

Uma API REST robusta, performática e tipada de ponta a ponta, desenvolvida com as melhores práticas de um desenvolvedor sênior.

## 🚀 Stack Técnica

- **Runtime:** [Bun](https://bun.sh) v1.1+ (até 18x mais rápido que Node.js)
- **Framework Web:** [ElysiaJS](https://elysiajs.com) (otimizado para Bun)
- **Banco de Dados:** MongoDB
- **ODM:** Mongoose com tipagem TypeScript forte
- **Validação:** TypeBox (nativo do Elysia)

## ✨ Características

### Arquitetura (S.O.L.I.D.)

- ✅ **Singleton Pattern** para conexão com MongoDB
- ✅ **Separação de Responsabilidades** (Config, Models, Routes)
- ✅ **Tipagem Forte** com TypeScript em toda aplicação
- ✅ **Validação em Runtime** com TypeBox
- ✅ **Tratamento Robusto de Erros**
- ✅ **Middleware Global** de logging e error handling
- ✅ **Health Checks** e monitoramento
- ✅ **Graceful Shutdown** para conexões

### Performance

- ⚡ **ElysiaJS** - Framework web mais rápido para Bun
- ⚡ **Índices Otimizados** no MongoDB
- ⚡ **Connection Pooling** configurado
- ⚡ **Paginação** em todas as listagens
- ⚡ **Busca Textual** otimizada

### Segurança

- 🔒 **Validação de Entrada** em todas as rotas
- 🔒 **Sanitização de Dados** automática
- 🔒 **Variáveis de Ambiente** para configurações sensíveis
- 🔒 **Error Messages** seguras em produção

## 📦 Instalação

### 🐳 Opção 1: Docker (Recomendado - Mais Fácil)

**Pré-requisito:** Docker instalado ([Instalar Docker](https://docs.docker.com/get-docker/))

```bash
# Desenvolvimento (com hot-reload)
docker-compose -f docker-compose.dev.yml up --build

# Ou em background
docker-compose -f docker-compose.dev.yml up -d
```

**Pronto!** 🎉 Acesse:
- API: http://localhost:3000
- MongoDB Admin: http://localhost:8081 (user: admin, pass: admin123)

📚 **Guia completo:** [DOCKER.md](DOCKER.md)

---

### 💻 Opção 2: Instalação Local (Sem Docker)

#### Pré-requisitos

1. **Instalar Bun:**
```bash
curl -fsSL https://bun.sh/install | bash
```

2. **MongoDB:**

Opção A - Docker:
```bash
docker run -d --name mongo-bun -p 27017:27017 mongo
```

Opção B - MongoDB Atlas (Gratuito):
- Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Crie um cluster gratuito
- Copie a connection string

#### Configuração do Projeto

1. **Clone e instale as dependências:**
```bash
cd /Users/brenossan/Documents/GitHub/msoftmanage
bun install
```

2. **Configure as variáveis de ambiente:**
```bash
# O arquivo .env já está criado com valores padrão
# Para MongoDB Atlas, edite o .env e substitua a MONGODB_URI:
# MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database
```

3. **Inicie o servidor em modo desenvolvimento:**
```bash
bun run dev
```

O servidor estará rodando em `http://localhost:3000` com hot-reload automático! 🎉

## 📚 Endpoints da API

### Health Check

```bash
# Status da API
GET http://localhost:3000/

# Health check detalhado
GET http://localhost:3000/health

# Documentação
GET http://localhost:3000/docs
```

### Produtos (CRUD Completo)

#### Listar Produtos
```bash
GET http://localhost:3000/products

# Com filtros e paginação
GET http://localhost:3000/products?category=Eletrônicos&page=1&limit=10
GET http://localhost:3000/products?inStock=true
GET http://localhost:3000/products?search=notebook
```

#### Buscar Produto por ID
```bash
GET http://localhost:3000/products/:id
```

#### Criar Produto
```bash
POST http://localhost:3000/products
Content-Type: application/json

{
  "name": "Notebook Dell",
  "price": 3500.00,
  "stock": 10,
  "description": "Notebook Dell Inspiron 15",
  "category": "Eletrônicos",
  "isActive": true
}
```

#### Atualizar Produto (Completo)
```bash
PUT http://localhost:3000/products/:id
Content-Type: application/json

{
  "name": "Notebook Dell Atualizado",
  "price": 3200.00,
  "stock": 15
}
```

#### Atualizar Produto (Parcial)
```bash
PATCH http://localhost:3000/products/:id
Content-Type: application/json

{
  "price": 3000.00
}
```

#### Deletar Produto
```bash
DELETE http://localhost:3000/products/:id
```

#### Diminuir Estoque
```bash
POST http://localhost:3000/products/:id/decrease-stock
Content-Type: application/json

{
  "quantity": 2
}
```

## 🧪 Testando a API

### Usando cURL

```bash
# Criar produto
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mouse Gamer",
    "price": 150.00,
    "stock": 50,
    "category": "Eletrônicos"
  }'

# Listar produtos
curl http://localhost:3000/products

# Buscar produto específico (substitua ID)
curl http://localhost:3000/products/65a1b2c3d4e5f6g7h8i9j0k1
```

### Usando Postman/Insomnia

Importe a collection disponível em `/docs/api-collection.json` (criar se necessário).

## 📁 Estrutura do Projeto

```
msoftmanage/
├── src/
│   ├── config/
│   │   └── database.ts      # Singleton de conexão MongoDB
│   ├── models/
│   │   └── Product.ts       # Schema e Model do Produto
│   ├── routes/
│   │   └── products.ts      # Rotas CRUD de produtos
│   └── index.ts             # Entry point da aplicação
├── .env                     # Variáveis de ambiente
├── .env.example             # Template de variáveis
├── .gitignore
├── package.json
├── tsconfig.json            # Configuração TypeScript
└── README.md
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento com hot-reload
bun run dev

# Produção
bun run start

# Build
bun run build

# Testes (quando implementados)
bun run test
```

## 🎯 Próximos Passos (Sugestões)

- [ ] Implementar autenticação JWT
- [ ] Adicionar testes unitários e de integração
- [ ] Implementar rate limiting
- [ ] Adicionar cache com Redis
- [ ] Criar documentação Swagger/OpenAPI
- [ ] Implementar logs estruturados
- [ ] Adicionar CI/CD
- [ ] Implementar soft delete
- [ ] Adicionar upload de imagens
- [ ] Criar dashboard de métricas

## 🐛 Troubleshooting

### Erro: "command not found: bun"
```bash
# Reinstale o Bun
curl -fsSL https://bun.sh/install | bash
# Adicione ao PATH (se necessário)
export PATH="$HOME/.bun/bin:$PATH"
```

### Erro: "MONGODB_URI não está definida"
```bash
# Verifique se o arquivo .env existe
cat .env
# Se não existir, copie do exemplo
cp .env.example .env
```

### Erro: "MongoServerError: connect ECONNREFUSED"
```bash
# Verifique se o MongoDB está rodando
docker ps | grep mongo
# Se não estiver, inicie:
docker start mongo-bun
# Ou crie um novo container:
docker run -d --name mongo-bun -p 27017:27017 mongo
```

## 📝 Licença

MIT

## 👨‍💻 Autor

Desenvolvido com ❤️ usando Bun + ElysiaJS + MongoDB

---

**⚡ Powered by Bun - The fast all-in-one JavaScript runtime**
