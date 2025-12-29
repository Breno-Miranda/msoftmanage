# ⚡ Quick Start - 5 Minutos para Rodar

Guia rápido para ter a API funcionando em menos de 5 minutos!

## 🚀 Instalação Rápida

### 1. Instalar Bun (se ainda não tiver)
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Instalar Dependências
```bash
cd /Users/brenossan/Documents/GitHub/msoftmanage
bun install
```

### 3. Configurar MongoDB

**Opção A - Docker (Mais Rápido):**
```bash
docker run -d --name mongo-bun -p 27017:27017 mongo
```

**Opção B - MongoDB Atlas (Gratuito):**
1. Acesse https://www.mongodb.com/cloud/atlas
2. Crie uma conta gratuita
3. Crie um cluster
4. Copie a connection string
5. Cole no arquivo `.env`:
```bash
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database
```

### 4. Iniciar o Servidor
```bash
bun run dev
```

✅ **Pronto!** Acesse http://localhost:3000

---

## 🧪 Testando a API

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Criar um Produto
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notebook Dell",
    "price": 3500,
    "stock": 10,
    "category": "Eletrônicos"
  }'
```

### 3. Listar Produtos
```bash
curl http://localhost:3000/products
```

---

## 📁 Estrutura Simplificada

```
msoftmanage/
├── src/
│   ├── config/database.ts    # ← Conexão MongoDB (Singleton)
│   ├── models/Product.ts     # ← Schema do Produto
│   ├── routes/products.ts    # ← Endpoints CRUD
│   └── index.ts              # ← Entry Point
├── .env                      # ← Configurações
└── package.json
```

---

## 🎯 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Status da API |
| GET | `/health` | Health check |
| GET | `/products` | Lista produtos |
| POST | `/products` | Cria produto |
| GET | `/products/:id` | Busca produto |
| PUT | `/products/:id` | Atualiza produto |
| DELETE | `/products/:id` | Remove produto |

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento (hot-reload)
bun run dev

# Produção
bun run start

# Testes
bun test

# Verificar MongoDB
docker ps | grep mongo
```

---

## ❓ Problemas Comuns

### "command not found: bun"
```bash
# Adicione ao PATH
export PATH="$HOME/.bun/bin:$PATH"
```

### "MongoServerError: connect ECONNREFUSED"
```bash
# Inicie o MongoDB
docker start mongo-bun
```

### "MONGODB_URI não está definida"
```bash
# Verifique se o .env existe
cat .env
```

---

## 📚 Próximos Passos

1. ✅ Leia o [README.md](README.md) completo
2. ✅ Explore [BEST_PRACTICES.md](BEST_PRACTICES.md)
3. ✅ Veja exemplos em [ADVANCED_EXAMPLES.md](ADVANCED_EXAMPLES.md)
4. ✅ Use o arquivo [api.http](api.http) para testar no VS Code

---

## 🎉 Tudo Funcionando?

Agora você tem uma API REST profissional rodando! 🚀

**Dúvidas?** Consulte a documentação completa no [README.md](README.md)
