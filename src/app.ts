import { Elysia } from 'elysia';
import { db } from './config/database';
import { credentialRoutes } from './routes/credentials';
import { taskRoutes } from './routes/tasks';
import { authRoutes } from './routes/auth';

/**
 * Cria e configura a aplicação Elysia
 */
export const app = new Elysia()
    // Middleware global de logging
    .onRequest(({ request, path }) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${request.method} ${path}`);
    })

    // Middleware global de tratamento de erros
    .onError(({ code, error, set }) => {
        console.error('❌ Erro:', error);

        // Tratamento específico por tipo de erro
        switch (code) {
            case 'VALIDATION':
                set.status = 400;
                return {
                    success: false,
                    error: 'Erro de validação',
                    message: error.message,
                };

            case 'NOT_FOUND':
                set.status = 404;
                return {
                    success: false,
                    error: 'Rota não encontrada',
                };

            case 'INTERNAL_SERVER_ERROR':
                set.status = 500;
                return {
                    success: false,
                    error: 'Erro interno do servidor',
                    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
                };

            default:
                set.status = 500;
                return {
                    success: false,
                    error: 'Erro desconhecido',
                    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
                };
        }
    })

    // Rota de health check
    .get('/', () => ({
        success: true,
        message: 'API Bun + MongoDB está funcionando! 🚀',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    }))

    // Rota de status do banco de dados
    .get('/health', () => {
        const dbStatus = db.getConnectionStatus();

        return {
            success: true,
            status: 'healthy',
            database: {
                connected: dbStatus.isConnected,
                readyState: dbStatus.readyState,
                host: dbStatus.host,
                database: dbStatus.database,
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
        };
    })

    // Registra as rotas
    .use(credentialRoutes)
    .use(taskRoutes)
    .use(authRoutes)

    // Documentação automática (Swagger)
    .get('/docs', () => ({
        success: true,
        message: 'Documentação da API',
        endpoints: {
            health: 'GET /',
            healthCheck: 'GET /health',
            auth: {
                login: 'POST /auth/login',
                register: 'POST /auth/register',
                users: 'GET /auth/users'
            },
            credentials: {
                list: 'GET /credentials',
                get: 'GET /credentials/:id',
                create: 'POST /credentials',
            },
            tasks: {
                list: 'GET /tasks',
                get: 'GET /tasks/:id',
                create: 'POST /tasks',
            },
        },
    }));
