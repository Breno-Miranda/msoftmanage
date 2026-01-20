import { Elysia, t } from 'elysia';
import { User } from './user.model';
import { backupService } from '../../services/backup.service';

// Definição das rotas e validações do módulo de Usuários
export const userRoutes = new Elysia({ prefix: '/users' })
    .model({
        // Modelos de validação (Schema de Entrada/Saida)
        'user.create': t.Object({
            name: t.String(),
            email: t.String({ format: 'email' }),
            password: t.String({ minLength: 6 })
        }),
        'user.update': t.Object({
            name: t.Optional(t.String()),
            email: t.Optional(t.String({ format: 'email' }))
        })
    })

    // Listar todos os usuários
    .get('/', async () => {
        return await User.find();
    })

    // Buscar usuário por ID
    .get('/:id', async ({ params: { id }, error }) => {
        const user = await User.findById(id);
        if (!user) return error(404, 'Usuário não encontrado');
        return user;
    })

    // Criar novo usuário (Com Backup no Cassandra!)
    .post('/', async ({ body, error }) => {
        try {
            // 1. Cria no MongoDB
            const newUser = await User.create(body);

            // 2. Aciona Backup Assíncrono (Fire-and-forget)
            // Lembre-se: A tabela 'backup_users' precisa estar criada no Cassandra
            backupService.backup('backup_users', {
                id: newUser._id.toString(),
                email: newUser.email,
                name: newUser.name,
                created_at: newUser.createdAt
            });

            return newUser;
        } catch (e: any) {
            // Tratamento de erro de duplicidade (E11000)
            if (e.code === 11000) {
                return error(409, 'Email já cadastrado');
            }
            return error(500, 'Erro interno ao criar usuário');
        }
    }, {
        body: 'user.create' // Validação automática do Body
    })

    // Atualizar usuário
    .patch('/:id', async ({ params: { id }, body, error }) => {
        const updatedUser = await User.findByIdAndUpdate(id, body, { new: true });
        if (!updatedUser) return error(404, 'Usuário não encontrado');
        return updatedUser;
    }, {
        body: 'user.update'
    })

    // Deletar usuário
    .delete('/:id', async ({ params: { id }, error }) => {
        const deleted = await User.findByIdAndDelete(id);
        if (!deleted) return error(404, 'Usuário não encontrado');
        return { message: 'Usuário removido com sucesso' };
    });
