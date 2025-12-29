import mongoose from 'mongoose';

/**
 * Classe Singleton para gerenciar a conexão com MongoDB
 * Garante que apenas uma conexão seja estabelecida e reutilizada
 * 
 * @class DatabaseConnection
 * @pattern Singleton
 */
class DatabaseConnection {
    private static instance: DatabaseConnection;
    private isConnected: boolean = false;
    private connectionPromise: Promise<typeof mongoose> | null = null;

    /**
     * Construtor privado para implementar o padrão Singleton
     */
    private constructor() { }

    /**
     * Retorna a instância única da classe
     */
    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    /**
     * Conecta ao MongoDB com retry automático e configurações otimizadas
     * Implementa o padrão Singleton para evitar múltiplas conexões
     * 
     * @returns Promise<typeof mongoose>
     * @throws Error se a MONGODB_URI não estiver definida
     */
    public async connect(): Promise<typeof mongoose> {
        // Se já existe uma conexão em andamento, retorna a promise existente
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        // Se já está conectado, retorna o mongoose
        if (this.isConnected && mongoose.connection.readyState === 1) {
            console.log('✅ Usando conexão MongoDB existente');
            return mongoose;
        }

        const MONGODB_URI = process.env.MONGODB_URI;

        if (!MONGODB_URI) {
            throw new Error('❌ MONGODB_URI não está definida nas variáveis de ambiente');
        }

        // Log da URI mascarada para debug (esconde a senha)
        const maskedUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
        console.log('🔍 [DEBUG] Tentando conectar com URI:', maskedUri);
        console.log('🔍 [DEBUG] Todas as variáveis de ambiente disponíveis:');
        console.log('   - MONGODB_URI:', maskedUri);
        console.log('   - PORT:', process.env.PORT);
        console.log('   - NODE_ENV:', process.env.NODE_ENV);
        console.log('   - HOSTNAME:', process.env.HOSTNAME);

        // Cria uma nova promise de conexão
        this.connectionPromise = this.establishConnection(MONGODB_URI);

        try {
            const result = await this.connectionPromise;
            this.isConnected = true;
            return result;
        } catch (error) {
            this.connectionPromise = null;
            throw error;
        }
    }

    /**
     * Estabelece a conexão com o MongoDB com configurações otimizadas
     * 
     * @param uri - URI de conexão do MongoDB
     * @returns Promise<typeof mongoose>
     */
    private async establishConnection(uri: string): Promise<typeof mongoose> {
        try {
            console.log('🔄 Conectando ao MongoDB...');

            // Extrai informações da URI para debug
            const uriMatch = uri.match(/mongodb:\/\/(?:([^:]+):([^@]+)@)?([^:/]+)(?::(\d+))?\/(.+)/);
            if (uriMatch) {
                const [, user, , host, port, database] = uriMatch;
                console.log('🔍 [DEBUG] Detalhes da conexão:');
                console.log(`   - Usuário: ${user || 'sem autenticação'}`);
                console.log(`   - Host: ${host}`);
                console.log(`   - Porta: ${port || '27017'}`);
                console.log(`   - Banco: ${database}`);
            }

            const connection = await mongoose.connect(uri, {
                // Configurações otimizadas para produção
                maxPoolSize: 10, // Máximo de conexões no pool
                minPoolSize: 2,  // Mínimo de conexões mantidas
                socketTimeoutMS: 45000, // Timeout de socket
                serverSelectionTimeoutMS: 5000, // Timeout para seleção de servidor
                family: 4, // Força IPv4
            });

            console.log('✅ MongoDB conectado com sucesso!');
            console.log(`📊 Database: ${connection.connection.db.databaseName}`);
            console.log(`🌐 Host: ${connection.connection.host}`);

            // Event listeners para monitoramento
            this.setupEventListeners();

            return connection;
        } catch (error: any) {
            console.error('❌ Erro ao conectar ao MongoDB:', error);

            // Logs detalhados do erro
            if (error.code === 18 || error.codeName === 'AuthenticationFailed') {
                console.error('🔐 [ERRO DE AUTENTICAÇÃO]');
                console.error('   Possíveis causas:');
                console.error('   1. Usuário ou senha incorretos');
                console.error('   2. Usuário não tem permissão no banco de dados especificado');
                console.error('   3. Banco de autenticação incorreto (tente adicionar ?authSource=admin na URI)');
                console.error('');
                console.error('💡 Sugestões:');
                console.error('   - Verifique as credenciais no MongoDB');
                console.error('   - Tente: mongodb://user:pass@host:port/database?authSource=admin');
                console.error('   - Ou conecte sem autenticação se o MongoDB não tiver auth habilitado');
            }

            throw error;
        }
    }

    /**
     * Configura listeners para eventos do MongoDB
     * Útil para debugging e monitoramento em produção
     */
    private setupEventListeners(): void {
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB desconectado');
            this.isConnected = false;
        });

        mongoose.connection.on('error', (error) => {
            console.error('❌ Erro na conexão MongoDB:', error);
            this.isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconectado');
            this.isConnected = true;
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    /**
     * Desconecta do MongoDB de forma segura
     */
    public async disconnect(): Promise<void> {
        if (this.isConnected) {
            await mongoose.connection.close();
            this.isConnected = false;
            this.connectionPromise = null;
            console.log('👋 Conexão MongoDB fechada');
        }
    }

    /**
     * Retorna o status da conexão
     */
    public getConnectionStatus(): {
        isConnected: boolean;
        readyState: number;
        host?: string;
        database?: string;
    } {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            database: mongoose.connection.db?.databaseName,
        };
    }
}

// Exporta a instância única
export const db = DatabaseConnection.getInstance();
