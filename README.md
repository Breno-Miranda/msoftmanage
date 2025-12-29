# 🚀 msoftmanage API

API REST robusta construída com **Bun**, **MongoDB**, **ElysiaJS** e **TypeScript** para gerenciamento de produtos.

[![Bun](https://img.shields.io/badge/Bun-1.2.10-black?logo=bun)](https://bun.sh)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.20.4-green?logo=mongodb)](https://www.mongodb.com)
[![ElysiaJS](https://img.shields.io/badge/ElysiaJS-0.8.17-blue)](https://elysiajs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)](https://www.typescriptlang.org)

---

## 📋 Índice

- [Características](#-características)
- [Início Rápido](#-início-rápido)
- [Configuração](#-configuração)
- [Endpoints da API](#-endpoints-da-api)
- [Deploy com Docker](#-deploy-com-docker)
- [Deploy no Dokploy](#-deploy-no-dokploy)
- [Troubleshooting](#-troubleshooting)
- [Desenvolvimento](#-desenvolvimento)
- [Estrutura do Projeto](#-estrutura-do-projeto)

---

## ✨ Características

- ⚡ **Performance**: Powered by Bun - runtime JavaScript ultra-rápido
- 🗄️ **MongoDB**: Banco de dados NoSQL com Mongoose ODM
- 🔥 **ElysiaJS**: Framework web minimalista e type-safe
- 🐳 **Docker**: Containerização completa com Docker Compose
- 📝 **TypeScript**: Type safety em todo o código
- 🔄 **Hot Reload**: Desenvolvimento com auto-reload
- 🏥 **Health Checks**: Monitoramento de saúde da aplicação
- 🎯 **CRUD Completo**: Operações completas para produtos
- 🔒 **Singleton Pattern**: Conexão otimizada com MongoDB
- 📊 **Logging**: Sistema de logs estruturado

---

## 🚀 Início Rápido

### Pré-requisitos

- [Bun](https://bun.sh) >= 1.0.0
- [MongoDB](https://www.mongodb.com) >= 6.0 (local ou Atlas)
- [Docker](https://www.docker.com) (opcional)

### Instalação Local

```bash
# Clone o repositório
git clone https://github.com/Breno-Miranda/msoftmanage.git
cd msoftmanage

# Instale as dependências
bun install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Inicie o servidor de desenvolvimento
bun run dev
```

A API estará disponível em `http://localhost:3000`

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/msoftmanage
# Para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database?retryWrites=true&w=majority

# Server Configuration
PORT=3000
NODE_ENV=development
HOSTNAME=0.0.0.0
```

### Configuração para Produção (Dokploy)

Para deploy no Dokploy, configure as seguintes variáveis de ambiente no painel:

```bash
# Use a URL INTERNA do MongoDB (não a externa!)
MONGODB_URI=mongodb://main:senha@services-mongodb-XXXXX:27017/master?authSource=admin
PORT=3000
NODE_ENV=production
HOSTNAME=0.0.0.0
```

**⚠️ IMPORTANTE:**
- Use a URL **interna** do MongoDB (`services-mongodb-XXXXX:27017`)
- **NÃO** use a URL externa (`IP:porta`) para comunicação entre containers
- Adicione `?authSource=admin` se o usuário foi criado no banco `admin`

---

## 📡 Endpoints da API

### Sistema

#### `GET /`
Status básico da API

**Resposta:**
```json
{
  "success": true,
  "message": "API Bun + MongoDB está funcionando! 🚀",
  "version": "1.0.0",
  "timestamp": "2025-12-29T..."
}
```

#### `GET /health`
Health check detalhado com status do MongoDB

**Resposta:**
```json
{
  "success": true,
  "status": "healthy",
  "database": {
    "connected": true,
    "readyState": 1,
    "host": "localhost",
    "database": "msoftmanage"
  },
  "uptime": 123.45,
  "memory": {...},
  "timestamp": "2025-12-29T..."
}
```

#### `GET /docs`
Documentação dos endpoints disponíveis

---

### Produtos

#### `GET /products`
Lista todos os produtos

**Query Parameters:**
- `active` (opcional): Filtrar por produtos ativos (`true`/`false`)

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Produto Exemplo",
      "description": "Descrição do produto",
      "price": 99.90,
      "stock": 100,
      "category": "Eletrônicos",
      "active": true,
      "createdAt": "2025-12-29T...",
      "updatedAt": "2025-12-29T..."
    }
  ],
  "count": 1
}
```

#### `GET /products/:id`
Busca um produto por ID

**Resposta:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Produto Exemplo",
    ...
  }
}
```

#### `POST /products`
Cria um novo produto

**Body:**
```json
{
  "name": "Produto Novo",
  "description": "Descrição detalhada",
  "price": 149.90,
  "stock": 50,
  "category": "Eletrônicos",
  "active": true
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Produto criado com sucesso",
  "data": {
    "_id": "...",
    ...
  }
}
```

#### `PUT /products/:id`
Atualiza um produto (completo)

**Body:**
```json
{
  "name": "Produto Atualizado",
  "description": "Nova descrição",
  "price": 199.90,
  "stock": 75,
  "category": "Eletrônicos",
  "active": true
}
```

#### `PATCH /products/:id`
Atualiza um produto (parcial)

**Body:**
```json
{
  "price": 179.90,
  "stock": 60
}
```

#### `DELETE /products/:id`
Remove um produto

**Resposta:**
```json
{
  "success": true,
  "message": "Produto removido com sucesso"
}
```

#### `POST /products/:id/decrease-stock`
Diminui o estoque de um produto

**Body:**
```json
{
  "quantity": 5
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Estoque atualizado com sucesso",
  "data": {
    "_id": "...",
    "stock": 95,
    ...
  }
}
```

---

## 🐳 Deploy com Docker

### Docker Compose (Desenvolvimento)

```bash
# Inicia todos os serviços (API + MongoDB + Mongo Express)
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Parar serviços
docker-compose -f docker-compose.dev.yml down
```

**Serviços disponíveis:**
- API: `http://localhost:3000`
- MongoDB: `localhost:27017`
- Mongo Express: `http://localhost:8081`

### Docker Compose (Produção)

```bash
# Inicia em modo produção
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Parar serviços
docker-compose down
```

### Build Manual

```bash
# Build da imagem
docker build -t msoftmanage-api .

# Executar container
docker run -d \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://host:27017/database \
  -e NODE_ENV=production \
  --name msoftmanage-api \
  msoftmanage-api
```

---

## 🚀 Deploy no Dokploy

### 1. Configuração Inicial

1. **Crie um serviço MongoDB** no Dokploy (se ainda não tiver)
2. **Anote o nome do serviço** (ex: `services-mongodb-26873m`)
3. **Crie um serviço para a API** conectado ao repositório GitHub

### 2. Configurar Variáveis de Ambiente

No painel do Dokploy, adicione as seguintes variáveis:

```bash
# ⚠️ IMPORTANTE: Use a URL INTERNA do MongoDB!
MONGODB_URI=mongodb://usuario:senha@services-mongodb-XXXXX:27017/nome-do-banco?authSource=admin
PORT=3000
NODE_ENV=production
HOSTNAME=0.0.0.0
```

**Exemplo real:**
```bash
MONGODB_URI=mongodb://main:mongof250@services-mongodb-26873m:27017/master?authSource=admin
PORT=3000
NODE_ENV=production
HOSTNAME=0.0.0.0
```

### 3. Deploy

1. **Faça push** para o repositório GitHub
2. **Dokploy detectará** automaticamente e fará o build
3. **Aguarde** o build completar (~2-3 minutos)
4. **Verifique os logs** para confirmar que conectou ao MongoDB

### 4. Verificação

Teste os endpoints:

```bash
# Health check básico
curl https://seu-dominio.com/

# Health check com MongoDB
curl https://seu-dominio.com/health

# Deve retornar: "database.connected": true
```

---

## 🐛 Troubleshooting

### Erro: "MONGODB_URI não está definida"

**Causa:** Variável de ambiente não configurada

**Solução:**
1. Verifique se adicionou `MONGODB_URI` nas variáveis de ambiente
2. Reinicie o serviço após adicionar
3. Verifique os logs para confirmar

---

### Erro: "Authentication failed" (Code 18)

**Causa:** Credenciais incorretas ou banco de autenticação errado

**Soluções:**

1. **Adicione `?authSource=admin`** na URI:
   ```bash
   mongodb://user:pass@host:27017/database?authSource=admin
   ```

2. **Verifique as credenciais** no serviço MongoDB

3. **Use a URL interna** (não a externa):
   ```bash
   ✅ mongodb://main:senha@services-mongodb-XXXXX:27017/master
   ❌ mongodb://main:senha@82.25.79.56:2090/master
   ```

4. **Teste sem autenticação** (se aplicável):
   ```bash
   mongodb://services-mongodb-XXXXX:27017/master
   ```

---

### Erro: "Bad Gateway" (502)

**Causas possíveis:**

1. **Container não está rodando**
   - Verifique o status no Dokploy
   - Veja os logs para identificar o erro

2. **Variáveis de ambiente faltando**
   - Confirme que `MONGODB_URI`, `PORT`, `NODE_ENV` e `HOSTNAME` estão configuradas

3. **Porta não exposta**
   - Verifique se a porta 3000 está mapeada no Dokploy

4. **HOSTNAME incorreto**
   - Deve ser `HOSTNAME=0.0.0.0` para Docker

---

### Logs de Debug

A aplicação possui logs detalhados que mostram:

```bash
🔍 [DEBUG] Tentando conectar com URI: mongodb://user:****@host:port/database
🔍 [DEBUG] Todas as variáveis de ambiente disponíveis:
   - MONGODB_URI: mongodb://user:****@host:port/database
   - PORT: 3000
   - NODE_ENV: production
   - HOSTNAME: 0.0.0.0

🔄 Conectando ao MongoDB...
🔍 [DEBUG] Detalhes da conexão:
   - Usuário: user
   - Host: host
   - Porta: port
   - Banco: database

✅ MongoDB conectado com sucesso!
📊 Database: database
🌐 Host: host
🚀 Servidor iniciado com sucesso!
```

Use esses logs para diagnosticar problemas de conexão.

---

## 💻 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento com hot-reload
bun run dev

# Produção
bun run start

# Build
bun run build

# Testes
bun test
```

### Estrutura de Pastas

```
msoftmanage/
├── src/
│   ├── config/
│   │   └── database.ts      # Configuração MongoDB (Singleton)
│   ├── models/
│   │   └── Product.ts       # Model Mongoose de Produto
│   ├── routes/
│   │   └── products.ts      # Rotas de produtos
│   └── index.ts             # Entry point da aplicação
├── tests/
│   └── product.test.ts      # Testes unitários
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile               # Dockerfile de produção
├── Dockerfile.dev           # Dockerfile de desenvolvimento
├── docker-compose.yml       # Compose de produção
├── docker-compose.dev.yml   # Compose de desenvolvimento
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📚 Estrutura do Projeto

### Arquitetura

```
┌─────────────────┐
│   ElysiaJS      │  ← Framework Web
│   (Routes)      │
└────────┬────────┘
         │
┌────────▼────────┐
│   Controllers   │  ← Lógica de negócio
│   (Routes)      │
└────────┬────────┘
         │
┌────────▼────────┐
│   Models        │  ← Mongoose Models
│   (Mongoose)    │
└────────┬────────┘
         │
┌────────▼────────┐
│   Database      │  ← MongoDB
│   (Singleton)   │
└─────────────────┘
```

### Padrões Utilizados

- **Singleton Pattern**: Conexão única com MongoDB
- **MVC Pattern**: Separação de responsabilidades
- **Repository Pattern**: Abstração de acesso a dados
- **Error Handling**: Tratamento centralizado de erros
- **Type Safety**: TypeScript em todo o código

---

## 🔒 Boas Práticas Implementadas

### Código
- ✅ Singleton pattern para conexão DB
- ✅ Graceful shutdown
- ✅ Error handling centralizado
- ✅ Logging estruturado
- ✅ Health checks
- ✅ TypeScript para type safety
- ✅ Validação de dados

### Infraestrutura
- ✅ Docker multi-stage build
- ✅ Health checks no Dockerfile
- ✅ Variáveis de ambiente
- ✅ .dockerignore configurado
- ✅ Connection pooling otimizado

### Segurança
- ✅ .env no .gitignore
- ✅ Credenciais via variáveis de ambiente
- ✅ Timeouts configurados
- ✅ Error messages sanitizadas em produção
- ✅ Logs mascarados (senhas ocultas)

---

## 📈 Roadmap

### Curto Prazo
- [ ] Adicionar autenticação JWT
- [ ] Implementar rate limiting
- [ ] Configurar CORS específico
- [ ] Adicionar validação de dados mais robusta
- [ ] Implementar paginação nos endpoints

### Médio Prazo
- [ ] Adicionar cache (Redis)
- [ ] Implementar logging estruturado (Winston/Pino)
- [ ] Configurar APM (Application Performance Monitoring)
- [ ] Adicionar testes automatizados
- [ ] CI/CD com GitHub Actions

### Longo Prazo
- [ ] Implementar microserviços
- [ ] Adicionar message queue (RabbitMQ/Kafka)
- [ ] Implementar GraphQL
- [ ] Adicionar WebSockets
- [ ] Multi-tenancy

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 📞 Suporte

- **GitHub Issues**: [Reportar um problema](https://github.com/Breno-Miranda/msoftmanage/issues)
- **Email**: brenomirandaster@gmail.com

---

## 🙏 Agradecimentos

- [Bun](https://bun.sh) - Runtime JavaScript ultra-rápido
- [ElysiaJS](https://elysiajs.com) - Framework web minimalista
- [MongoDB](https://www.mongodb.com) - Banco de dados NoSQL
- [Mongoose](https://mongoosejs.com) - ODM para MongoDB
- [Dokploy](https://dokploy.com) - Plataforma de deploy

---

**Desenvolvido com ❤️ por [Breno Miranda](https://github.com/Breno-Miranda)**

**Versão:** 1.0.0  
**Última atualização:** 2025-12-29
