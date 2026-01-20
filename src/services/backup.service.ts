import { Client } from 'cassandra-driver';

/**
 * SERVIÇO DE BACKUP ASSÍNCRONO (CASSANDRA)
 * ---------------------------------------------------------
 * Este serviço gerencia a conexão com o Cassandra e permite
 * enviar dados para backup de forma "fire-and-forget",
 * sem bloquear a resposta principal da API.
 */
class CassandraBackupService {
    private client: Client;
    private isConnected: boolean = false;
    private queue: Array<any> = [];
    private isProcessing: boolean = false;

    constructor() {
        this.client = new Client({
            contactPoints: ['localhost'],
            localDataCenter: 'datacenter1',
            keyspace: 'mmanage_logs', // Usamos o mesmo keyspace de logs/backup
            socketOptions: {
                connectTimeout: 3000, // Timeout curto para não travar
                readTimeout: 3000
            }
        });

        this.connect();
    }

    // Conecta silenciosamente
    private async connect() {
        try {
            await this.client.connect();
            this.isConnected = true;

            this.processQueue(); // Processa itens que chegaram enquanto conectava
        } catch (err) {

            this.isConnected = false;
            // Tenta reconectar em 30s
            setTimeout(() => this.connect(), 30000);
        }
    }

    /**
     * Salva um registro de backup.
     * Use isso DEPOIS que a operação no Mongo der certo.
     * 
     * @param table Nome da tabela no Cassandra (ex: 'users_backup')
     * @param data Objeto com os dados a salvar
     */
    public async backup(table: string, data: any) {
        // Normaliza os dados para não quebrar o Cassandra
        // (Converte Dates para strings ISO se necessário, remove undefineds)
        const safeData = this.sanitize(data);

        // Adiciona timestamp de backup se não tiver
        if (!safeData.backup_timestamp) {
            safeData.backup_timestamp = new Date();
        }

        // Se estiver conectado, tenta enviar direto
        if (this.isConnected) {
            this.sendToCassandra(table, safeData).catch(() => {

                // Opcional: Salvar em arquivo de dead-letter queue
            });
        } else {
            // Se offline, guarda na fila (limitada para não estourar RAM)
            if (this.queue.length < 1000) {
                this.queue.push({ table, data: safeData });
            }
        }
    }

    private async sendToCassandra(table: string, data: any) {
        // GERAÇÃO DINÂMICA DE QUERIES (SIMPLIFICADA)
        // Atenção: Em prod, ideal ter Prepared Statements fixos para performance.
        // Aqui fazemos dinâmico para ganhar flexibilidade no MVP.

        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');

        const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) USING TTL 31536000`; // TTL de 1 ano

        await this.client.execute(query, values, { prepare: true });
    }

    private async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;



        while (this.queue.length > 0 && this.isConnected) {
            const item = this.queue.shift();
            if (item) {
                await this.sendToCassandra(item.table, item.data).catch(() => { });
            }
        }

        this.isProcessing = false;
    }

    private sanitize(data: any): any {
        // Implementar limpeza se necessário
        // Ex: Converter ObjectId do Mongo para string
        return JSON.parse(JSON.stringify(data));
    }
}

export const backupService = new CassandraBackupService();
