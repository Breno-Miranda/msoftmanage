import { Elysia, t } from 'elysia';
import { Product, IProduct } from '../models/Product';

/**
 * Schema de validação TypeBox para criação de produto
 * O Elysia usa TypeBox para validação em runtime
 */
const createProductSchema = t.Object({
    name: t.String({ minLength: 3, maxLength: 100 }),
    price: t.Number({ minimum: 0 }),
    stock: t.Integer({ minimum: 0 }),
    description: t.Optional(t.String({ maxLength: 500 })),
    category: t.Optional(
        t.Union([
            t.Literal('Eletrônicos'),
            t.Literal('Roupas'),
            t.Literal('Alimentos'),
            t.Literal('Livros'),
            t.Literal('Outros'),
        ])
    ),
    isActive: t.Optional(t.Boolean()),
});

/**
 * Schema para atualização de produto (todos os campos opcionais)
 */
const updateProductSchema = t.Object({
    name: t.Optional(t.String({ minLength: 3, maxLength: 100 })),
    price: t.Optional(t.Number({ minimum: 0 })),
    stock: t.Optional(t.Integer({ minimum: 0 })),
    description: t.Optional(t.String({ maxLength: 500 })),
    category: t.Optional(
        t.Union([
            t.Literal('Eletrônicos'),
            t.Literal('Roupas'),
            t.Literal('Alimentos'),
            t.Literal('Livros'),
            t.Literal('Outros'),
        ])
    ),
    isActive: t.Optional(t.Boolean()),
});

/**
 * Schema para parâmetros de ID
 */
const idParamSchema = t.Object({
    id: t.String({ minLength: 24, maxLength: 24 }), // MongoDB ObjectId tem 24 caracteres
});

/**
 * Rotas de Produtos - CRUD Completo
 * Implementa todas as operações com validação e tratamento de erros
 */
export const productRoutes = new Elysia({ prefix: '/products' })
    /**
     * GET /products - Lista todos os produtos
     * Query params: category, inStock, search
     */
    .get(
        '/',
        async ({ query }) => {
            try {
                const { category, inStock, search, page = '1', limit = '10' } = query as any;

                // Constrói o filtro dinamicamente
                const filter: any = {};

                if (category) {
                    filter.category = category;
                }

                if (inStock === 'true') {
                    filter.stock = { $gt: 0 };
                    filter.isActive = true;
                }

                if (search) {
                    filter.$text = { $search: search };
                }

                // Paginação
                const pageNum = parseInt(page);
                const limitNum = parseInt(limit);
                const skip = (pageNum - 1) * limitNum;

                const [products, total] = await Promise.all([
                    Product.find(filter)
                        .limit(limitNum)
                        .skip(skip)
                        .sort({ createdAt: -1 }),
                    Product.countDocuments(filter),
                ]);

                return {
                    success: true,
                    data: products,
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
                    error: 'Erro ao buscar produtos',
                    message: error.message,
                };
            }
        },
        {
            detail: {
                summary: 'Lista todos os produtos',
                tags: ['Products'],
            },
        }
    )

    /**
     * GET /products/:id - Busca produto por ID
     */
    .get(
        '/:id',
        async ({ params, set }) => {
            try {
                const product = await Product.findById(params.id);

                if (!product) {
                    set.status = 404;
                    return {
                        success: false,
                        error: 'Produto não encontrado',
                    };
                }

                return {
                    success: true,
                    data: product,
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
            params: idParamSchema,
            detail: {
                summary: 'Busca produto por ID',
                tags: ['Products'],
            },
        }
    )

    /**
     * POST /products - Cria novo produto
     */
    .post(
        '/',
        async ({ body, set }) => {
            try {
                const product = new Product(body);
                await product.save();

                set.status = 201;
                return {
                    success: true,
                    message: 'Produto criado com sucesso',
                    data: product,
                };
            } catch (error: any) {
                set.status = 400;
                return {
                    success: false,
                    error: 'Erro ao criar produto',
                    message: error.message,
                    details: error.errors,
                };
            }
        },
        {
            body: createProductSchema,
            detail: {
                summary: 'Cria um novo produto',
                tags: ['Products'],
            },
        }
    )

    /**
     * PUT /products/:id - Atualiza produto completo
     */
    .put(
        '/:id',
        async ({ params, body, set }) => {
            try {
                const product = await Product.findByIdAndUpdate(
                    params.id,
                    body,
                    {
                        new: true, // Retorna o documento atualizado
                        runValidators: true, // Executa validações do schema
                    }
                );

                if (!product) {
                    set.status = 404;
                    return {
                        success: false,
                        error: 'Produto não encontrado',
                    };
                }

                return {
                    success: true,
                    message: 'Produto atualizado com sucesso',
                    data: product,
                };
            } catch (error: any) {
                set.status = 400;
                return {
                    success: false,
                    error: 'Erro ao atualizar produto',
                    message: error.message,
                    details: error.errors,
                };
            }
        },
        {
            params: idParamSchema,
            body: updateProductSchema,
            detail: {
                summary: 'Atualiza um produto',
                tags: ['Products'],
            },
        }
    )

    /**
     * PATCH /products/:id - Atualização parcial
     */
    .patch(
        '/:id',
        async ({ params, body, set }) => {
            try {
                const product = await Product.findByIdAndUpdate(
                    params.id,
                    { $set: body },
                    {
                        new: true,
                        runValidators: true,
                    }
                );

                if (!product) {
                    set.status = 404;
                    return {
                        success: false,
                        error: 'Produto não encontrado',
                    };
                }

                return {
                    success: true,
                    message: 'Produto atualizado com sucesso',
                    data: product,
                };
            } catch (error: any) {
                set.status = 400;
                return {
                    success: false,
                    error: 'Erro ao atualizar produto',
                    message: error.message,
                };
            }
        },
        {
            params: idParamSchema,
            body: updateProductSchema,
            detail: {
                summary: 'Atualização parcial de produto',
                tags: ['Products'],
            },
        }
    )

    /**
     * DELETE /products/:id - Remove produto
     */
    .delete(
        '/:id',
        async ({ params, set }) => {
            try {
                const product = await Product.findByIdAndDelete(params.id);

                if (!product) {
                    set.status = 404;
                    return {
                        success: false,
                        error: 'Produto não encontrado',
                    };
                }

                return {
                    success: true,
                    message: 'Produto removido com sucesso',
                    data: product,
                };
            } catch (error: any) {
                set.status = 400;
                return {
                    success: false,
                    error: 'Erro ao remover produto',
                    message: error.message,
                };
            }
        },
        {
            params: idParamSchema,
            detail: {
                summary: 'Remove um produto',
                tags: ['Products'],
            },
        }
    )

    /**
     * POST /products/:id/decrease-stock - Diminui estoque
     */
    .post(
        '/:id/decrease-stock',
        async ({ params, body, set }) => {
            try {
                const product = await Product.findById(params.id);

                if (!product) {
                    set.status = 404;
                    return {
                        success: false,
                        error: 'Produto não encontrado',
                    };
                }

                const { quantity } = body as { quantity: number };
                await product.decreaseStock(quantity);

                return {
                    success: true,
                    message: 'Estoque atualizado com sucesso',
                    data: product,
                };
            } catch (error: any) {
                set.status = 400;
                return {
                    success: false,
                    error: 'Erro ao atualizar estoque',
                    message: error.message,
                };
            }
        },
        {
            params: idParamSchema,
            body: t.Object({
                quantity: t.Integer({ minimum: 1 }),
            }),
            detail: {
                summary: 'Diminui estoque do produto',
                tags: ['Products'],
            },
        }
    );
