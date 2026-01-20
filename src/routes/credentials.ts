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
                const { page = '1', limit = '10', rule, userId } = query as any;
                const pageNum = parseInt(page);
                const limitNum = parseInt(limit);
                const skip = (pageNum - 1) * limitNum;

                const filter: any = {};

                // If userId is present, filter by it
                if (userId) {
                    if (rule === 'movida') {
                        // Legacy/Migration rule: Show user's own + public (no userId)
                        filter.$or = [
                            { userId: userId },
                            { userId: { $exists: false } },
                            { userId: null }
                        ];
                    } else {
                        // Strict rule: Only show user's own
                        filter.userId = userId;
                    }
                } else {
                    // No user ID provided - Return empty or public only
                    // For security, strictly return empty or only explicitly public items
                    // Current decision: Return empty to prevent data leak
                    return {
                        success: true,
                        data: [],
                        pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 }
                    };
                }

                const [items, total] = await Promise.all([
                    mCredential.find(filter)
                        .limit(limitNum)
                        .skip(skip)
                        .sort({ createdAt: -1 }),
                    mCredential.countDocuments(filter),
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
