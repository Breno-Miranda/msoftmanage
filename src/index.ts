import { db } from './config/database';
import { app } from './app';

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
