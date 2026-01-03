import { Elysia } from 'elysia';
import { mCredential } from '../models/mCredential';

export const credentialRoutes = new Elysia({ prefix: '/credentials' })
    /**
     * GET /credentials - Lista todos os registros
     */
    .get(
        '/',
        async ({ query }) => {
            try {
                const { page = '1', limit = '10' } = query as any;
                const pageNum = parseInt(page);
                const limitNum = parseInt(limit);
                const skip = (pageNum - 1) * limitNum;

                const [items, total] = await Promise.all([
                    mCredential.find()
                        .limit(limitNum)
                        .skip(skip)
                        .sort({ createdAt: -1 }),
                    mCredential.countDocuments(),
                ]);

                return {
                    success: true,
                    data: items,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        totalPages: Math.ceil(total / limitNum),
                    },
                };
            } catch (error: any) {
                return {
                    success: false,
                    error: 'Erro ao buscar credentials',
                    message: error.message,
                };
            }
        },
        {
            detail: {
                summary: 'Lista credentials',
                tags: ['Credentials'],
            },
        }
    )

    /**
     * GET /credentials/:id - Busca por ID
     */
    .get(
        '/:id',
        async ({ params, set }) => {
            try {
                const item = await mCredential.findById(params.id);

                if (!item) {
                    set.status = 404;
                    return {
                        success: false,
                        error: 'Credential não encontrada',
                    };
                }

                return {
                    success: true,
                    data: item,
                };
            } catch (error: any) {
                set.status = 400;
                return {
                    success: false,
                    error: 'ID inválido',
                    message: error.message,
                };
            }
        },
        {
            detail: {
                summary: 'Busca credential por ID',
                tags: ['Credentials'],
            },
        }
    )

    /**
     * POST /credentials - Cria novo registro
     */
    .post(
        '/',
        async ({ body, set }) => {
            try {
                const newItem = new mCredential(body);
                await newItem.save();

                set.status = 201;
                return {
                    success: true,
                    message: 'Credential criada com sucesso',
                    data: newItem,
                };
            } catch (error: any) {
                set.status = 400;
                return {
                    success: false,
                    error: 'Erro ao criar credential',
                    message: error.message,
                };
            }
        },
        {
            detail: {
                summary: 'Cria nova credential',
                tags: ['Credentials'],
            },
        }
    );
