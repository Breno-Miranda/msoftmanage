import { Elysia } from 'elysia';
import { db } from './config/database';
import { productRoutes } from './routes/products';

/**
 * Inicializa a conexão com o banco de dados
 * Deve ser chamada antes de iniciar o servidor
 */
async function initializeDatabase() {
    try {
        await db.connect();
    } catch (error) {
        console.error('❌ Falha ao conectar ao banco de dados:', error);
        process.exit(1);
    }
}

/**
 * Cria e configura a aplicação Elysia
 */
const app = new Elysia()
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

    // Registra as rotas de produtos
    .use(productRoutes)

    // Documentação automática (Swagger)
    .get('/docs', () => ({
        success: true,
        message: 'Documentação da API',
        endpoints: {
            health: 'GET /',
            healthCheck: 'GET /health',
            products: {
                list: 'GET /products',
                get: 'GET /products/:id',
                create: 'POST /products',
                update: 'PUT /products/:id',
                partialUpdate: 'PATCH /products/:id',
                delete: 'DELETE /products/:id',
                decreaseStock: 'POST /products/:id/decrease-stock',
            },
        },
    }));

/**
 * Inicializa a aplicação
 */
async function start() {
    try {
        // Conecta ao banco de dados
        await initializeDatabase();

        // Inicia o servidor
        const PORT = process.env.PORT || 3000;
        const HOSTNAME = process.env.HOSTNAME || '0.0.0.0'; // 0.0.0.0 para Docker

        app.listen({
            port: PORT,
            hostname: HOSTNAME,
        }, () => {
            console.log('\n🚀 Servidor iniciado com sucesso!');
            console.log(`📡 Rodando em: http://${HOSTNAME}:${PORT}`);
            console.log(`📚 Documentação: http://localhost:${PORT}/docs`);
            console.log(`💚 Health Check: http://localhost:${PORT}/health`);
            console.log(`\n⚡ Powered by Bun + ElysiaJS + MongoDB\n`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Inicia a aplicação
start();
