import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { connectMongo } from './config/mongo';
import { userRoutes } from './modules/users/user.controller';
import { authRoutes } from './routes/auth';
import { appRoutes } from './routes/apps';
import { catalogRoutes } from './routes/catalog';
import { credentialRoutes } from './routes/credentials';
import { healthtechRoutes } from './routes/healthtech';
import { taskRoutes } from './routes/tasks';
import { blogRoutes } from './routes/blogs';
import { contentRoutes } from './routes/content';
import { logRoutes } from './routes/logs';

// 1. Inicializa Conexão com Banco
await connectMongo();

// 2. Cria a Aplicação
const app = new Elysia()
    .use(cors()) // Habilita CORS
    .get('/', () => '🦊 MManage API is Running!')

    // 3. Registra os Módulos
    .use(userRoutes)
    .use(authRoutes)
    .use(appRoutes) // Msite Apps (Install/Verify)
    .use(catalogRoutes) // Marketplace Catalog
    .use(credentialRoutes) // Mcredential 
    .use(healthtechRoutes) // HealthTech Dashboard
    .use(taskRoutes) // MTasks
    .use(blogRoutes) // Blogs
    .use(contentRoutes) // Content Managementes)
    .use(logRoutes)

    .listen(3000);
