# 🚀 Exemplos Avançados - Expandindo a API

Este documento mostra como expandir a API com recursos mais avançados.

## 📋 Índice

1. [Autenticação JWT](#autenticação-jwt)
2. [Upload de Arquivos](#upload-de-arquivos)
3. [WebSockets](#websockets)
4. [Cache com Redis](#cache-com-redis)
5. [Relacionamentos](#relacionamentos)
6. [Agregações MongoDB](#agregações-mongodb)

## 🔐 Autenticação JWT

### Instalação
```bash
bun add jsonwebtoken @types/jsonwebtoken bcryptjs @types/bcryptjs
```

### Model de Usuário
```typescript
// src/models/User.ts
import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false, // Não retorna por padrão
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
}, { timestamps: true });

// Hash da senha antes de salvar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar senhas
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', UserSchema);
```

### Middleware de Autenticação
```typescript
// src/middlewares/auth.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const authMiddleware = async ({ headers, set }: any) => {
  const token = headers.authorization?.replace('Bearer ', '');

  if (!token) {
    set.status = 401;
    return {
      success: false,
      error: 'Token não fornecido',
    };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    set.status = 401;
    return {
      success: false,
      error: 'Token inválido',
    };
  }
};
```

### Rotas de Autenticação
```typescript
// src/routes/auth.ts
import { Elysia, t } from 'elysia';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post(
    '/register',
    async ({ body, set }) => {
      try {
        const existingUser = await User.findOne({ email: body.email });
        
        if (existingUser) {
          set.status = 400;
          return {
            success: false,
            error: 'Email já cadastrado',
          };
        }

        const user = new User(body);
        await user.save();

        const token = jwt.sign(
          { userId: user._id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return {
          success: true,
          data: {
            user: {
              id: user._id,
              email: user.email,
              name: user.name,
              role: user.role,
            },
            token,
          },
        };
      } catch (error: any) {
        set.status = 400;
        return {
          success: false,
          error: 'Erro ao criar usuário',
          message: error.message,
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 6 }),
        name: t.String({ minLength: 2 }),
      }),
    }
  )
  .post(
    '/login',
    async ({ body, set }) => {
      try {
        const user = await User.findOne({ email: body.email }).select('+password');

        if (!user || !(await user.comparePassword(body.password))) {
          set.status = 401;
          return {
            success: false,
            error: 'Credenciais inválidas',
          };
        }

        const token = jwt.sign(
          { userId: user._id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return {
          success: true,
          data: {
            user: {
              id: user._id,
              email: user.email,
              name: user.name,
              role: user.role,
            },
            token,
          },
        };
      } catch (error: any) {
        set.status = 400;
        return {
          success: false,
          error: 'Erro ao fazer login',
          message: error.message,
        };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  );
```

## 📤 Upload de Arquivos

```typescript
// src/routes/upload.ts
import { Elysia } from 'elysia';
import { writeFile } from 'fs/promises';
import path from 'path';

export const uploadRoutes = new Elysia({ prefix: '/upload' })
  .post('/image', async ({ body, set }) => {
    try {
      const { file } = body as { file: File };

      if (!file) {
        set.status = 400;
        return {
          success: false,
          error: 'Nenhum arquivo enviado',
        };
      }

      // Valida tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        set.status = 400;
        return {
          success: false,
          error: 'Tipo de arquivo não permitido',
        };
      }

      // Valida tamanho (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        set.status = 400;
        return {
          success: false,
          error: 'Arquivo muito grande (máximo 5MB)',
        };
      }

      // Gera nome único
      const timestamp = Date.now();
      const ext = path.extname(file.name);
      const filename = `${timestamp}${ext}`;
      const filepath = path.join(process.cwd(), 'uploads', filename);

      // Salva arquivo
      const arrayBuffer = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(arrayBuffer));

      return {
        success: true,
        data: {
          filename,
          url: `/uploads/${filename}`,
          size: file.size,
          type: file.type,
        },
      };
    } catch (error: any) {
      set.status = 500;
      return {
        success: false,
        error: 'Erro ao fazer upload',
        message: error.message,
      };
    }
  });
```

## 🔌 WebSockets

```typescript
// src/routes/websocket.ts
import { Elysia } from 'elysia';

export const websocketRoutes = new Elysia()
  .ws('/ws', {
    open(ws) {
      console.log('Cliente conectado');
      ws.send(JSON.stringify({ type: 'connected', message: 'Bem-vindo!' }));
    },
    message(ws, message) {
      console.log('Mensagem recebida:', message);
      
      // Broadcast para todos os clientes
      ws.publish('chat', JSON.stringify({
        type: 'message',
        data: message,
        timestamp: new Date().toISOString(),
      }));
    },
    close(ws) {
      console.log('Cliente desconectado');
    },
  });
```

## 🗄️ Cache com Redis

```bash
bun add ioredis
```

```typescript
// src/config/redis.ts
import Redis from 'ioredis';

class RedisConnection {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });
    }
    return RedisConnection.instance;
  }
}

export const redis = RedisConnection.getInstance();
```

```typescript
// Uso em rotas
import { redis } from '../config/redis';

// Cache de listagem
.get('/', async ({ query }) => {
  const cacheKey = `products:list:${JSON.stringify(query)}`;
  
  // Tenta buscar do cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Busca do banco
  const products = await Product.find();
  
  // Salva no cache (5 minutos)
  await redis.setex(cacheKey, 300, JSON.stringify(products));
  
  return products;
})
```

## 🔗 Relacionamentos

```typescript
// src/models/Category.ts
export interface ICategory extends Document {
  name: string;
  description: string;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  description: String,
});

export const Category = model<ICategory>('Category', CategorySchema);

// Atualizar Product.ts
const ProductSchema = new Schema({
  // ... campos existentes
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category', // Referência
    required: true,
  },
});

// Uso com populate
const products = await Product.find()
  .populate('category', 'name description'); // Popula dados da categoria
```

## 📊 Agregações MongoDB

```typescript
// Estatísticas de produtos
.get('/stats', async () => {
  const stats = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalProducts: { $sum: 1 },
        totalStock: { $sum: '$stock' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { totalProducts: -1 },
    },
  ]);

  return {
    success: true,
    data: stats,
  };
})

// Produtos mais vendidos (requer campo 'sales')
.get('/top-selling', async () => {
  const topProducts = await Product.aggregate([
    { $match: { isActive: true } },
    { $sort: { sales: -1 } },
    { $limit: 10 },
    {
      $project: {
        name: 1,
        price: 1,
        sales: 1,
        revenue: { $multiply: ['$price', '$sales'] },
      },
    },
  ]);

  return {
    success: true,
    data: topProducts,
  };
})
```

## 🎯 Rate Limiting

```bash
bun add @elysiajs/rate-limit
```

```typescript
import { rateLimit } from '@elysiajs/rate-limit';

const app = new Elysia()
  .use(
    rateLimit({
      duration: 60000, // 1 minuto
      max: 100, // 100 requisições
      generator: (req) => req.headers.get('x-forwarded-for') || 'anonymous',
    })
  );
```

## 📧 Envio de Emails

```bash
bun add nodemailer @types/nodemailer
```

```typescript
// src/services/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}
```

---

Estes são apenas alguns exemplos de como expandir sua API. A arquitetura modular permite adicionar novos recursos facilmente! 🚀
