import { Elysia } from 'elysia';
import { Client, auth } from 'cassandra-driver';

/**
 * EXEMPLO DE CONEXÃO ELYSIA + CASSANDRA
 * ---------------------------------------------------------
 * Para rodar este exemplo, você precisa instalar o driver:
 * $ bun add cassandra-driver
 */

// 1. Configuração do Cliente Cassandra
// Diferente do Mongo/Mongoose, aqui a configuração é mais "crua"
const client = new Client({
    contactPoints: ['localhost'], // IPs dos nós do Cassandra
    localDataCenter: 'datacenter1', // Nome do DC configurado no Cassandra
    keyspace: 'mmanage_logs', // Nome do banco de dados (Keyspace)
    // Se tiver autenticação:
    // authProvider: new auth.PlainTextAuthProvider('usuario', 'senha')
});

const app = new Elysia()
    .onError(({ code, error }) => {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    })

    // 2. Conectar ao iniciar
    .onStart(async () => {
        try {
            await client.connect();

        } catch (err) {

        }
    })

    // 3. Exemplo de Rota: Listar Logs (SELECT)
    // No Cassandra, você NÃO pode buscar por qualquer campo livremente como no Mongo.
    // Você só pode filtrar pela "Partition Key" e "Clustering Key".
    .get('/logs/:userId', async ({ params: { userId } }) => {
        const query = 'SELECT * FROM user_activity_logs WHERE user_id = ?';

        // Executando a query preparada (Prepared Statements são vitais no Cassandra)
        const result = await client.execute(query, [userId], { prepare: true });

        // O resultado vem em linhas (rows)
        return {
            count: result.rowLength,
            data: result.rows
        };
    })

    // 4. Exemplo de Rota: Criar Log (INSERT)
    .post('/logs', async ({ body }: { body: any }) => {
        // No Cassandra, INSERT também serve como UPDATE (Upsert)
        const query = `
            INSERT INTO user_activity_logs (user_id, activity_id, action, timestamp) 
            VALUES (?, uuid(), ?, toTimestamp(now()))
        `;

        await client.execute(query, [body.userId, body.action], { prepare: true });

        return { status: 'Log gravado com sucesso' };
    })

    .listen(3002);



/*
 * NOTAS DE COMPLEXIDADE (CASSANDRA vs MONGO):
 * 
 * 1. Modelagem (Schema):
 *    - Mongo: Você cria o Schema no código (Mongoose) e pode mudar fácil.
 *    - Cassandra: Você PRECISA criar as tabelas no banco ANTES com CQL.
 *      Ex: CREATE TABLE user_activity_logs (user_id text, activity_id uuid, action text, timestamp timestamp, PRIMARY KEY (user_id, activity_id));
 * 
 * 2. Queries:
 *    - Mongo: db.users.find({ age: { $gt: 18 } }) -> Super flexível.
 *    - Cassandra: Você SÓ pode consultar pelo que está na PRIMARY KEY. 
 *      Quer consultar por 'action'? Não pode, a menos que crie um índice secundário ou outra tabela.
 * 
 * 3. Migrations:
 *    - Cassandra não tem "Auto Migration" fácil como o TypeORM/Prisma.
 */
