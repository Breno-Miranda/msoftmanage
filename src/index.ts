import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { connectMongo } from './config/mongo';
import { userRoutes } from './modules/users/user.controller';
import { authRoutes } from './routes/auth';
import { appRoutes } from './routes/apps';
import { credentialRoutes } from './routes/credentials';
import { healthtechRoutes } from './routes/healthtech';
import { taskRoutes } from './routes/tasks';

// 1. Inicializa Conexão com Banco
await connectMongo();

// 2. Cria a Aplicação
const app = new Elysia()
    .use(cors()) // Habilita CORS
    .get('/', () => '🦊 MManage API is Running!')

    // 3. Registra os Módulos
    .use(userRoutes)
    .use(authRoutes)
    .use(appRoutes)
    .use(credentialRoutes)
    .use(healthtechRoutes)
    .use(taskRoutes)

    .listen(3000);


