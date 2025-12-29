# 🚨 Troubleshooting: Bad Gateway (502)

## 📋 Checklist de Diagnóstico

Siga estes passos na ordem para identificar e resolver o problema:

---

### ✅ Passo 1: Verificar Status do Container

**No painel do Dokploy:**
1. Acesse o serviço: `services-api-x5fsxp`
2. Verifique o **Status**

**Status esperado:** 🟢 Running

**Se estiver parado (🔴 Stopped):**
- Clique em **Start** ou **Restart**
- Aguarde 30 segundos
- Teste novamente

**Se continuar parando:**
- Vá para o Passo 2 (verificar logs)

---

### ✅ Passo 2: Verificar Logs do Container

**No painel do Dokploy:**
1. Vá até: `services-api-x5fsxp`
2. Clique em: **Logs** ou **Terminal**
3. Procure por mensagens de erro

**Logs esperados (sucesso):**
```
🔄 Conectando ao MongoDB...
✅ MongoDB conectado com sucesso!
📊 Database: msoftmanage
🌐 Host: services-mongodb-26873m
🚀 Servidor iniciado com sucesso!
📡 Rodando em: http://0.0.0.0:3000
```

**Erros comuns:**

#### ❌ Erro 1: "MONGODB_URI não está definida"
```
❌ MONGODB_URI não está definida nas variáveis de ambiente
```

**Solução:**
1. Vá em: Environment Variables
2. Adicione:
   ```
   MONGODB_URI=mongodb://master:mongof250@services-mongodb-26873m:27017/msoftmanage
   ```
3. Salve e reinicie

---

#### ❌ Erro 2: "Failed to connect to MongoDB"
```
❌ Erro ao conectar ao MongoDB: MongoServerError
```

**Possíveis causas:**

**A) MongoDB não está rodando**
- Verifique o status do serviço: `services-mongodb-26873m`
- Se estiver parado, inicie-o
- Aguarde 1 minuto e reinicie a API

**B) Credenciais incorretas**
- Verifique usuário: `master`
- Verifique senha: `mongof250`
- Verifique host: `services-mongodb-26873m`

**C) Nome do serviço MongoDB incorreto**
- Confirme o nome exato do serviço MongoDB no Dokploy
- Pode ser diferente de `services-mongodb-26873m`
- Atualize a URI com o nome correto

**D) Rede entre containers não configurada**
- Verifique se ambos os serviços estão na mesma rede
- No Dokploy, isso geralmente é automático

---

#### ❌ Erro 3: "Address already in use"
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solução:**
1. Reinicie o container
2. Se persistir, mude a porta:
   - Environment Variables: `PORT=3001`
   - Atualize o port mapping no Dokploy

---

#### ❌ Erro 4: "Cannot find module"
```
Error: Cannot find module 'mongoose'
```

**Solução:**
- Isso indica problema no build
- Force um rebuild:
  1. No Dokploy: **Rebuild** ou **Redeploy**
  2. Aguarde o build completar
  3. Verifique os logs do build

---

### ✅ Passo 3: Verificar Variáveis de Ambiente

**No painel do Dokploy:**
1. Vá em: Environment Variables
2. Confirme que tem TODAS estas variáveis:

```bash
MONGODB_URI=mongodb://master:mongof250@services-mongodb-26873m:27017/msoftmanage
PORT=3000
NODE_ENV=production
HOSTNAME=0.0.0.0
```

**Importante:**
- ✅ `HOSTNAME=0.0.0.0` é OBRIGATÓRIO para Docker
- ✅ `/msoftmanage` no final da URI é importante
- ✅ Não pode ter espaços extras

**Se faltou alguma:**
1. Adicione a variável
2. Salve
3. Reinicie o serviço

---

### ✅ Passo 4: Verificar Port Mapping

**No painel do Dokploy:**
1. Vá em: Settings ou Configuration
2. Procure por: **Ports** ou **Port Mapping**
3. Deve ter: `3000` (ou a porta que você configurou)

**Configuração esperada:**
- Container Port: `3000`
- Host Port: `3000` (ou qualquer porta disponível)

**Se não estiver configurado:**
1. Adicione o port mapping
2. Salve
3. Reinicie

---

### ✅ Passo 5: Verificar MongoDB

**Verifique se o MongoDB está rodando:**

1. No Dokploy, acesse: `services-mongodb-26873m`
2. Verifique o **Status**: deve estar 🟢 Running
3. Verifique os **Logs** do MongoDB

**Se o MongoDB estiver parado:**
1. Inicie o serviço MongoDB
2. Aguarde 1 minuto
3. Reinicie a API

**Teste de conexão manual:**

Se tiver acesso ao terminal do container da API:
```bash
# Teste de conexão
mongosh "mongodb://master:mongof250@services-mongodb-26873m:27017/msoftmanage"
```

---

### ✅ Passo 6: Verificar Rede Docker

**No painel do Dokploy:**

Verifique se ambos os serviços estão na mesma rede:
1. API: `services-api-x5fsxp`
2. MongoDB: `services-mongodb-26873m`

**No Dokploy, isso geralmente é automático**, mas se não estiver funcionando:
- Verifique a configuração de rede
- Pode ser necessário usar o IP interno ao invés do nome do serviço

---

### ✅ Passo 7: Force Rebuild

Se nada acima funcionou:

1. No Dokploy, vá até: `services-api-x5fsxp`
2. Clique em: **Rebuild** ou **Redeploy**
3. Aguarde o build completar (2-3 minutos)
4. Verifique os logs do build
5. Após o build, verifique os logs da aplicação

---

## 🔍 Comandos de Diagnóstico

### Ver logs em tempo real
```bash
# No painel do Dokploy
Serviço > Logs > Enable "Follow logs"
```

### Verificar se a porta está aberta
```bash
# No terminal do servidor (se tiver acesso SSH)
docker ps | grep services-api
docker logs services-api-x5fsxp
```

### Testar conexão interna
```bash
# No terminal do container da API
curl http://localhost:3000/health
```

---

## 📊 Matriz de Diagnóstico

| Sintoma | Causa Provável | Solução |
|---------|----------------|---------|
| Container parado | Erro ao iniciar | Verificar logs |
| Logs: "MONGODB_URI não definida" | Variável faltando | Adicionar variável |
| Logs: "Failed to connect" | MongoDB parado/incorreto | Verificar MongoDB |
| Logs: "Address in use" | Porta ocupada | Reiniciar container |
| Container rodando, mas 502 | HOSTNAME incorreto | Adicionar HOSTNAME=0.0.0.0 |
| Build falhou | Dependências/código | Force rebuild |

---

## 🆘 Próximos Passos

1. **Siga o checklist acima na ordem**
2. **Anote qual erro você encontrou nos logs**
3. **Aplique a solução correspondente**
4. **Teste novamente**

---

## 📝 Informações para Debug

Se precisar de ajuda adicional, colete estas informações:

1. **Status do container API:** (Running/Stopped)
2. **Status do container MongoDB:** (Running/Stopped)
3. **Últimas 50 linhas dos logs da API**
4. **Variáveis de ambiente configuradas**
5. **Port mapping configurado**

---

## ✅ Teste Final

Após resolver, teste:

```bash
# Substitua pelo seu domínio
curl https://seu-dominio.com/health
```

**Resposta esperada:**
```json
{
  "success": true,
  "status": "healthy",
  "database": {
    "connected": true
  }
}
```

---

**Última atualização:** 2025-12-29  
**Erro:** Bad Gateway (502)  
**Status:** Em diagnóstico
