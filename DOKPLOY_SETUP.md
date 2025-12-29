# 🚀 Configuração de Produção - Dokploy

## ✅ Build Concluído com Sucesso

O build do Dokploy foi concluído com sucesso! Agora siga os passos abaixo para configurar o ambiente de produção.

---

## 📋 Variáveis de Ambiente Obrigatórias

Configure estas variáveis no painel do Dokploy:

### 1. MongoDB Connection
```bash
MONGODB_URI=mongodb://seu-usuario:sua-senha@seu-host:27017/nome-do-banco
```

**Opções:**
- **MongoDB Atlas** (Recomendado para produção):
  ```bash
  MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database?retryWrites=true&w=majority
  ```
- **MongoDB Local/Container**:
  ```bash
  MONGODB_URI=mongodb://mongo:27017/bun-api
  ```

### 2. Server Configuration
```bash
PORT=3000
NODE_ENV=production
HOSTNAME=0.0.0.0
```

---

## 🔧 Passos no Painel Dokploy

### 1. Acessar Configurações do Serviço
1. Acesse o painel do Dokploy
2. Vá até o serviço `services-api-x5fsxp`
3. Clique em **Environment Variables** ou **Settings**

### 2. Adicionar Variáveis de Ambiente
Adicione cada variável listada acima:
- Nome: `MONGODB_URI`
- Valor: `sua-connection-string-mongodb`

### 3. Configurar Porta (se necessário)
- Certifique-se de que a porta **3000** está exposta
- Configure o domínio/subdomínio se desejar

### 4. Reiniciar o Serviço
Após adicionar as variáveis, reinicie o serviço para aplicar as mudanças.

---

## 🗄️ Opções de Banco de Dados

### Opção 1: MongoDB Atlas (Recomendado)
✅ **Vantagens:**
- Gerenciado e escalável
- Backup automático
- Alta disponibilidade
- Free tier disponível

**Passos:**
1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie um cluster gratuito
3. Configure o usuário e senha
4. Adicione o IP do servidor Dokploy na whitelist (ou use `0.0.0.0/0` para permitir todos)
5. Copie a connection string

### Opção 2: MongoDB no Dokploy
Se preferir rodar o MongoDB no próprio Dokploy:

1. Crie um novo serviço MongoDB no Dokploy
2. Use a connection string: `mongodb://mongo:27017/bun-api`
3. Configure volumes para persistência de dados

---

## 🔍 Verificação de Saúde

Após o deploy, teste os endpoints:

### 1. Health Check Principal
```bash
curl https://seu-dominio.com/
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "API Bun + MongoDB está funcionando! 🚀",
  "version": "1.0.0",
  "timestamp": "2025-12-29T17:50:00.000Z"
}
```

### 2. Health Check Detalhado
```bash
curl https://seu-dominio.com/health
```

**Resposta esperada:**
```json
{
  "success": true,
  "status": "healthy",
  "database": {
    "connected": true,
    "readyState": "connected",
    "host": "cluster.mongodb.net",
    "database": "seu-banco"
  },
  "uptime": 123.45,
  "memory": {...},
  "timestamp": "2025-12-29T17:50:00.000Z"
}
```

### 3. Documentação
```bash
curl https://seu-dominio.com/docs
```

---

## 📊 Endpoints Disponíveis

### Produtos
- `GET /products` - Lista todos os produtos
- `GET /products/:id` - Busca produto por ID
- `POST /products` - Cria novo produto
- `PUT /products/:id` - Atualiza produto completo
- `PATCH /products/:id` - Atualiza produto parcial
- `DELETE /products/:id` - Remove produto
- `POST /products/:id/decrease-stock` - Diminui estoque

---

## ⚠️ Avisos e Notas

### Warning do Build
```
UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 18)
```
**Status:** ⚠️ Não crítico - O build foi concluído com sucesso apesar do warning.

### Segurança
- ✅ O arquivo `.env` está no `.gitignore` (não será commitado)
- ✅ Use variáveis de ambiente do Dokploy para dados sensíveis
- ✅ Configure CORS se necessário para produção
- ✅ Considere adicionar autenticação/autorização para endpoints críticos

---

## 🚀 Próximos Passos

1. ✅ **Configurar MongoDB** - Escolha entre Atlas ou local
2. ✅ **Adicionar variáveis de ambiente** no Dokploy
3. ✅ **Reiniciar o serviço**
4. ✅ **Testar endpoints** de health check
5. ✅ **Configurar domínio** (opcional)
6. ✅ **Monitorar logs** para garantir que está tudo funcionando

---

## 📝 Logs e Monitoramento

Para visualizar os logs no Dokploy:
1. Acesse o painel do serviço
2. Clique em **Logs** ou **Terminal**
3. Verifique se há mensagens de erro

**Logs esperados no início:**
```
🚀 Servidor iniciado com sucesso!
📡 Rodando em: http://0.0.0.0:3000
📚 Documentação: http://localhost:3000/docs
💚 Health Check: http://localhost:3000/health

⚡ Powered by Bun + ElysiaJS + MongoDB
```

---

## 🆘 Troubleshooting

### Erro de Conexão com MongoDB
**Sintoma:** `database.connected: false` no `/health`

**Soluções:**
1. Verifique se a `MONGODB_URI` está correta
2. Confirme que o IP do servidor está na whitelist (MongoDB Atlas)
3. Teste a conexão manualmente
4. Verifique os logs do serviço

### Porta não acessível
**Sintoma:** Não consegue acessar a API

**Soluções:**
1. Verifique se a porta 3000 está exposta no Dokploy
2. Configure o proxy reverso se necessário
3. Verifique as configurações de firewall

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Dokploy
2. Teste os endpoints de health check
3. Revise as variáveis de ambiente
4. Consulte a documentação do Dokploy

**Documentação do Projeto:**
- `README.md` - Visão geral
- `QUICKSTART.md` - Início rápido
- `DOCKER.md` - Configuração Docker
- `BEST_PRACTICES.md` - Melhores práticas
