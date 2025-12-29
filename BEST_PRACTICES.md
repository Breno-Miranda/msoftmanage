# 🎯 Guia de Boas Práticas - Desenvolvedor Sênior

Este documento contém as melhores práticas aplicadas neste projeto e recomendações para expansão.

## 📋 Índice

1. [Arquitetura](#arquitetura)
2. [Padrões de Código](#padrões-de-código)
3. [Performance](#performance)
4. [Segurança](#segurança)
5. [Testes](#testes)
6. [Deploy](#deploy)

## 🏗️ Arquitetura

### Singleton Pattern para Conexão MongoDB

**Por quê?**
- Evita múltiplas conexões desnecessárias
- Reutiliza conexões existentes
- Essencial em ambientes serverless e hot-reload

```typescript
// ❌ ERRADO - Cria nova conexão a cada requisição
export async function connect() {
  return await mongoose.connect(uri);
}

// ✅ CORRETO - Singleton com cache de conexão
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connectionPromise: Promise<typeof mongoose> | null = null;
  
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
}
```

### Separação de Responsabilidades

```
src/
├── config/       # Configurações (DB, env, etc)
├── models/       # Schemas e Models do Mongoose
├── routes/       # Endpoints e validações
├── services/     # Lógica de negócio (quando necessário)
├── middlewares/  # Middlewares customizados
└── types/        # Tipos TypeScript
```

## 💻 Padrões de Código

### Tipagem Forte

**Sempre defina interfaces para seus modelos:**

```typescript
// ✅ CORRETO
export interface IProduct extends Document {
  name: string;
  price: number;
  stock: number;
}

const ProductSchema = new Schema<IProduct>({ ... });
export const Product = model<IProduct>('Product', ProductSchema);
```

### Validação em Múltiplas Camadas

1. **Runtime (TypeBox/Elysia)**: Valida entrada do usuário
2. **Mongoose Schema**: Valida antes de salvar no banco
3. **Business Logic**: Valida regras de negócio

```typescript
// Camada 1: TypeBox
const schema = t.Object({
  price: t.Number({ minimum: 0 })
});

// Camada 2: Mongoose
price: {
  type: Number,
  min: [0, 'Preço não pode ser negativo'],
  validate: {
    validator: (v) => /^\d+(\.\d{1,2})?$/.test(v.toString()),
    message: 'Máximo 2 casas decimais'
  }
}

// Camada 3: Business Logic
if (quantity > this.stock) {
  throw new Error('Estoque insuficiente');
}
```

### Tratamento de Erros Consistente

```typescript
// ✅ Sempre retorne objetos padronizados
return {
  success: false,
  error: 'Mensagem amigável',
  message: error.message, // Detalhes técnicos
};

// ❌ Nunca exponha erros internos em produção
if (process.env.NODE_ENV === 'development') {
  return { error: error.stack };
}
```

## ⚡ Performance

### Índices no MongoDB

```typescript
// Índices simples para campos frequentemente consultados
ProductSchema.index({ name: 1 });
ProductSchema.index({ isActive: 1 });

// Índices compostos para queries complexas
ProductSchema.index({ category: 1, isActive: 1 });

// Índice de texto para busca
ProductSchema.index({ name: 'text', description: 'text' });
```

### Connection Pooling

```typescript
mongoose.connect(uri, {
  maxPoolSize: 10,  // Máximo de conexões simultâneas
  minPoolSize: 2,   // Mínimo mantido aberto
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
});
```

### Paginação Obrigatória

```typescript
// ✅ SEMPRE implemente paginação em listagens
const pageNum = parseInt(page) || 1;
const limitNum = parseInt(limit) || 10;
const skip = (pageNum - 1) * limitNum;

const products = await Product.find()
  .limit(limitNum)
  .skip(skip);
```

## 🔒 Segurança

### Variáveis de Ambiente

```bash
# ✅ NUNCA commite .env
# ✅ SEMPRE forneça .env.example
# ✅ Valide variáveis obrigatórias no startup

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI é obrigatória');
}
```

### Sanitização de Dados

```typescript
// Mongoose já faz sanitização básica, mas:
name: {
  type: String,
  trim: true,           // Remove espaços
  lowercase: true,      // Normaliza
  maxlength: 100,       // Limita tamanho
}
```

### Rate Limiting (Próximo Passo)

```typescript
import { rateLimit } from 'elysia-rate-limit';

app.use(rateLimit({
  duration: 60000,  // 1 minuto
  max: 100,         // 100 requisições
}));
```

## 🧪 Testes

### Estrutura de Testes

```typescript
describe('Feature', () => {
  beforeAll(async () => {
    // Setup: conectar ao banco de testes
  });

  afterAll(async () => {
    // Cleanup: limpar dados de teste
  });

  test('deve fazer X', async () => {
    // Arrange
    const data = { ... };
    
    // Act
    const response = await app.handle(request);
    
    // Assert
    expect(response.status).toBe(200);
  });
});
```

### Cobertura de Testes

- ✅ Testes unitários para lógica de negócio
- ✅ Testes de integração para endpoints
- ✅ Testes de validação para schemas
- ✅ Testes de erro para edge cases

## 🚀 Deploy

### Variáveis de Ambiente em Produção

```bash
# Produção
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
PORT=3000

# Opcional
LOG_LEVEL=error
RATE_LIMIT_MAX=1000
```

### Docker (Opcional)

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --production

COPY src ./src
COPY tsconfig.json ./

EXPOSE 3000

CMD ["bun", "run", "start"]
```

### Health Checks

```typescript
// Sempre implemente health checks para monitoramento
app.get('/health', () => ({
  status: 'healthy',
  database: db.getConnectionStatus(),
  uptime: process.uptime(),
}));
```

## 📊 Monitoramento (Próximos Passos)

### Logs Estruturados

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

logger.info({ userId, action: 'create_product' }, 'Produto criado');
```

### Métricas

```typescript
// Prometheus, DataDog, New Relic, etc.
import { metrics } from './monitoring';

metrics.increment('api.requests.total');
metrics.timing('api.response.time', duration);
```

## 🎓 Princípios SOLID Aplicados

- **S**ingle Responsibility: Cada arquivo tem uma responsabilidade clara
- **O**pen/Closed: Extensível via plugins do Elysia
- **L**iskov Substitution: Interfaces bem definidas
- **I**nterface Segregation: Tipos específicos por contexto
- **D**ependency Inversion: Injeção de dependências quando necessário

## 📚 Recursos Adicionais

- [Bun Documentation](https://bun.sh/docs)
- [ElysiaJS Documentation](https://elysiajs.com)
- [Mongoose Best Practices](https://mongoosejs.com/docs/guide.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Lembre-se:** Código bom não é apenas código que funciona, é código que é fácil de entender, manter e evoluir. 🚀
