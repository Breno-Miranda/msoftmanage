# 🚀 Guia Rápido - Verificação de Produção

## ✅ Suas Configurações Atuais

```bash
MONGODB_URI=mongodb://master:mongof250@services-mongodb-26873m:27017/msoftmanage
PORT=3000
NODE_ENV=production
HOSTNAME=0.0.0.0
```

---

## 📝 Correção Necessária

### ⚠️ URI do MongoDB

**Atual:**
```
mongodb://master:mongof250@services-mongodb-26873m:27017
```

**Correto (adicione o nome do banco):**
```
mongodb://master:mongof250@services-mongodb-26873m:27017/msoftmanage
```

**Por quê?** O nome do banco (`/msoftmanage`) no final da URI é importante para que o MongoDB saiba qual banco usar.

---

## 🔧 Passos para Atualizar no Dokploy

1. **Acesse o painel do Dokploy**
2. **Vá até o serviço:** `services-api-x5fsxp`
3. **Clique em:** Environment Variables
4. **Atualize a variável `MONGODB_URI`:**
   ```
   mongodb://master:mongof250@services-mongodb-26873m:27017/msoftmanage
   ```
5. **Adicione a variável `HOSTNAME` (se ainda não tiver):**
   ```
   HOSTNAME=0.0.0.0
   ```
6. **Salve e reinicie o serviço**

---

## ✅ Verificação Rápida

Após reiniciar o serviço, teste os seguintes endpoints:

### 1. Health Check Básico
```bash
curl https://seu-dominio.com/
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "API Bun + MongoDB está funcionando! 🚀",
  "version": "1.0.0",
  "timestamp": "2025-12-29T..."
}
```

### 2. Health Check com MongoDB
```bash
curl https://seu-dominio.com/health
```

**Resposta esperada (MongoDB conectado):**
```json
{
  "success": true,
  "status": "healthy",
  "database": {
    "connected": true,
    "readyState": 1,
    "host": "services-mongodb-26873m",
    "database": "msoftmanage"
  },
  "uptime": 123.45,
  "memory": {...},
  "timestamp": "2025-12-29T..."
}
```

### 3. Documentação
```bash
curl https://seu-dominio.com/docs
```

---

## 🐛 Troubleshooting

### Se `database.connected: false`

**Possíveis causas:**
1. ✅ Nome do banco faltando na URI (adicione `/msoftmanage`)
2. ✅ Serviço MongoDB não está rodando
3. ✅ Credenciais incorretas
4. ✅ Rede entre containers não configurada

**Como verificar:**

1. **Verifique se o MongoDB está rodando:**
   - No painel do Dokploy, verifique o status do serviço `services-mongodb-26873m`

2. **Teste a conexão manualmente:**
   ```bash
   # No terminal do container da API
   bun run -e "import mongoose from 'mongoose'; mongoose.connect('mongodb://master:mongof250@services-mongodb-26873m:27017/msoftmanage').then(() => console.log('✅ Conectado!')).catch(e => console.error('❌ Erro:', e))"
   ```

3. **Verifique os logs:**
   - Logs da API: Procure por mensagens de erro de conexão
   - Logs do MongoDB: Verifique se há tentativas de conexão

---

## 📊 Testando a API Completa

### Criar um Produto
```bash
curl -X POST https://seu-dominio.com/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Teste",
    "description": "Primeiro produto em produção",
    "price": 99.90,
    "stock": 100,
    "category": "Eletrônicos",
    "active": true
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Produto criado com sucesso",
  "data": {
    "_id": "...",
    "name": "Produto Teste",
    "price": 99.90,
    ...
  }
}
```

### Listar Produtos
```bash
curl https://seu-dominio.com/products
```

### Buscar Produto Específico
```bash
curl https://seu-dominio.com/products/ID_DO_PRODUTO
```

---

## 🎯 Checklist Final

- [ ] URI do MongoDB atualizada com `/msoftmanage`
- [ ] Variável `HOSTNAME=0.0.0.0` adicionada
- [ ] Serviço reiniciado no Dokploy
- [ ] Endpoint `/` respondendo com sucesso
- [ ] Endpoint `/health` mostrando `database.connected: true`
- [ ] Conseguiu criar um produto de teste
- [ ] Conseguiu listar produtos

---

## 🚀 Próximos Passos

Após confirmar que está tudo funcionando:

1. **Configure um domínio** (opcional)
2. **Adicione autenticação** se necessário
3. **Configure backup do MongoDB**
4. **Monitore os logs** regularmente
5. **Documente suas APIs** para o time

---

## 📞 Comandos Úteis

### Ver logs da API
```bash
# No painel do Dokploy
Serviço > Logs
```

### Reiniciar serviço
```bash
# No painel do Dokploy
Serviço > Restart
```

### Verificar variáveis de ambiente
```bash
# No painel do Dokploy
Serviço > Environment Variables
```

---

## ✨ Status

**Build:** ✅ Concluído  
**Variáveis de Ambiente:** ⚠️ Precisa adicionar `/msoftmanage` na URI  
**MongoDB:** ✅ Configurado (local no Dokploy)  
**Próxima Ação:** Atualizar MONGODB_URI e reiniciar

---

**Data:** 2025-12-29  
**Versão:** 1.0.0  
**Ambiente:** Produção (Dokploy)
