# 🐳 Guia Docker - API Bun + MongoDB

Guia completo para rodar a aplicação com Docker e Docker Compose.

---

## 🚀 Quick Start

### Desenvolvimento (com hot-reload)
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Produção
```bash
docker-compose up --build -d
```

---

## 📋 Pré-requisitos

- **Docker** instalado: https://docs.docker.com/get-docker/
- **Docker Compose** instalado (geralmente vem com Docker Desktop)

### Verificar instalação
```bash
docker --version
docker-compose --version
```

---

## 🛠️ Comandos Principais

### Desenvolvimento

```bash
# Iniciar em modo desenvolvimento (hot-reload)
docker-compose -f docker-compose.dev.yml up

# Iniciar em background
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Ver logs apenas da API
docker-compose -f docker-compose.dev.yml logs -f api

# Parar containers
docker-compose -f docker-compose.dev.yml down

# Parar e remover volumes (limpa banco de dados)
docker-compose -f docker-compose.dev.yml down -v
```

### Produção

```bash
# Build e iniciar
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Reiniciar apenas a API
docker-compose restart api

# Ver status dos containers
docker-compose ps
```

---

## 🌐 Acessando os Serviços

Após iniciar os containers:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **API** | http://localhost:3000 | API REST |
| **API Health** | http://localhost:3000/health | Health check |
| **API Docs** | http://localhost:3000/docs | Documentação |
| **Mongo Express** | http://localhost:8081 | Interface MongoDB |
| **MongoDB** | mongodb://localhost:27017 | Banco de dados |

### Credenciais Mongo Express
- **Usuário:** admin
- **Senha:** admin123

---

## 📦 Estrutura dos Containers

### Container: `msoftmanage-api`
- **Imagem:** Bun Alpine (otimizada)
- **Porta:** 3000
- **Health Check:** GET /health a cada 30s

### Container: `msoftmanage-mongodb`
- **Imagem:** MongoDB 7.0
- **Porta:** 27017
- **Volumes:** Dados persistidos em volume Docker
- **Health Check:** mongosh ping a cada 10s

### Container: `msoftmanage-mongo-express`
- **Imagem:** Mongo Express 1.0.2
- **Porta:** 8081
- **Função:** Interface web para gerenciar MongoDB

---

## 🔧 Configurações Avançadas

### Variáveis de Ambiente

Edite o `docker-compose.yml` para customizar:

```yaml
services:
  api:
    environment:
      NODE_ENV: production
      PORT: 3000
      MONGODB_URI: mongodb://mongodb:27017/bun-api
      # Adicione suas variáveis aqui
```

### Alterar Portas

```yaml
services:
  api:
    ports:
      - "8080:3000"  # Muda porta externa para 8080
```

### Volumes Persistentes

Os dados do MongoDB são salvos em volumes Docker:

```bash
# Listar volumes
docker volume ls

# Inspecionar volume
docker volume inspect msoftmanage_mongodb_data

# Backup do banco
docker exec msoftmanage-mongodb mongodump --out /data/backup

# Restaurar backup
docker exec msoftmanage-mongodb mongorestore /data/backup
```

---

## 🧪 Testando a API

### Usando cURL

```bash
# Health check
curl http://localhost:3000/health

# Criar produto
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Docker",
    "price": 99.99,
    "stock": 10,
    "category": "Eletrônicos"
  }'

# Listar produtos
curl http://localhost:3000/products
```

### Usando Docker Exec

```bash
# Executar comando dentro do container da API
docker exec -it msoftmanage-api bun --version

# Acessar shell do container
docker exec -it msoftmanage-api sh

# Acessar MongoDB
docker exec -it msoftmanage-mongodb mongosh
```

---

## 🐛 Troubleshooting

### Erro: "port is already allocated"

```bash
# Verificar o que está usando a porta
lsof -i :3000

# Ou mudar a porta no docker-compose.yml
ports:
  - "3001:3000"
```

### Erro: "Cannot connect to MongoDB"

```bash
# Verificar se o MongoDB está rodando
docker-compose ps

# Ver logs do MongoDB
docker-compose logs mongodb

# Reiniciar MongoDB
docker-compose restart mongodb
```

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs api

# Verificar health check
docker inspect msoftmanage-api | grep -A 10 Health
```

### Limpar tudo e recomeçar

```bash
# Para todos os containers
docker-compose down

# Remove volumes (CUIDADO: apaga dados)
docker-compose down -v

# Remove imagens
docker-compose down --rmi all

# Rebuild completo
docker-compose up --build --force-recreate
```

---

## 📊 Monitoramento

### Ver uso de recursos

```bash
# Estatísticas em tempo real
docker stats

# Apenas containers deste projeto
docker stats msoftmanage-api msoftmanage-mongodb
```

### Logs estruturados

```bash
# Últimas 100 linhas
docker-compose logs --tail=100

# Seguir logs em tempo real
docker-compose logs -f

# Logs com timestamp
docker-compose logs -t
```

---

## 🚀 Deploy em Produção

### 1. Build otimizado

```bash
docker-compose build --no-cache
```

### 2. Iniciar em background

```bash
docker-compose up -d
```

### 3. Verificar saúde

```bash
docker-compose ps
curl http://localhost:3000/health
```

### 4. Configurar restart automático

Já configurado no `docker-compose.yml`:
```yaml
restart: unless-stopped
```

---

## 🔐 Segurança em Produção

### 1. Remover Mongo Express

Comente ou remova o serviço `mongo-express` do `docker-compose.yml` em produção.

### 2. Usar secrets para senhas

```yaml
services:
  mongodb:
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
```

### 3. Network isolada

Já configurado - apenas a API é exposta publicamente.

---

## 📝 Diferenças Dev vs Prod

| Característica | Desenvolvimento | Produção |
|----------------|-----------------|----------|
| **Hot-reload** | ✅ Sim | ❌ Não |
| **Volumes** | ✅ Código montado | ❌ Código no build |
| **Logs** | Verbose | Otimizado |
| **Build** | Rápido | Otimizado |
| **Mongo Express** | ✅ Habilitado | ⚠️ Desabilitar |

---

## 🎯 Próximos Passos

- [ ] Configurar CI/CD com GitHub Actions
- [ ] Adicionar Nginx como reverse proxy
- [ ] Implementar SSL/TLS
- [ ] Configurar backup automático do MongoDB
- [ ] Adicionar Redis para cache
- [ ] Implementar logging centralizado

---

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Bun Docker Image](https://hub.docker.com/r/oven/bun)
- [MongoDB Docker Image](https://hub.docker.com/_/mongo)

---

**🐳 Sua aplicação está completamente containerizada e pronta para produção!**
