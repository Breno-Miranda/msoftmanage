import { Elysia } from 'elysia';
import { mRestaurantMenuCategory } from '../../models/mRestaurantMenuCategory';
import { mRestaurantMenuItem } from '../../models/mRestaurantMenuItem';
import { mRestaurantIngredient } from '../../models/mRestaurantIngredient';
import { mRestaurantTable } from '../../models/mRestaurantTable';
import { mRestaurantOrder } from '../../models/mRestaurantOrder';
import { checkTenantAccess } from '../../middleware/tenantPlugin';
import { adjustStock, getLowStockIngredients } from './services/stock.service';
import { addItemToOrder, calculateOrderTotals, closeOrder, removeItemFromOrder, updateTableStatusOnOrderOpen } from './services/order.service';
import { getDailyReport, getTopItemsReport } from './services/report.service';

function toSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function slugWithUuid(name: string, uuid: string): string {
    return `${toSlug(name)}-${uuid.slice(0, 6)}`;
}

function handleError(set: any, error: any, status = 500) {
    set.status = status;
    return { success: false, error: error.message || String(error) };
}

export const restaurantRoutes = new Elysia({ prefix: '/restaurant' })
    // ── CATEGORIAS ─────────────────────────────────────────────────────────
    .get('/menu/categories', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'viewer');
        if (guard) return guard;

        try {
            const { appKey, status = 'active' } = ctx.query as Record<string, string>;
            const filter: Record<string, any> = { appKey };
            if (status !== 'all') filter.status = status;

            const data = await mRestaurantMenuCategory.find(filter).sort({ sortOrder: 1, name: 1 });
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .post('/menu/categories', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const body = ctx.body as any;
            if (!body.appKey || !body.name) {
                ctx.set.status = 400;
                return { success: false, error: 'appKey e name são obrigatórios' };
            }
            const uuid = crypto.randomUUID();
            const data = await mRestaurantMenuCategory.create({ ...body, uuid });
            ctx.set.status = 201;
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .put('/menu/categories/:uuid', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const body = ctx.body as any;
            delete body.uuid;
            delete body.appKey;
            const data = await mRestaurantMenuCategory.findOneAndUpdate(
                { uuid: ctx.params.uuid, appKey: ctx.query.appKey },
                { $set: body },
                { new: true }
            );
            if (!data) { ctx.set.status = 404; return { success: false, error: 'Categoria não encontrada' }; }
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .delete('/menu/categories/:uuid', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const data = await mRestaurantMenuCategory.findOneAndUpdate(
                { uuid: ctx.params.uuid, appKey: ctx.query.appKey },
                { $set: { status: 'archived' } },
                { new: true }
            );
            if (!data) { ctx.set.status = 404; return { success: false, error: 'Categoria não encontrada' }; }
            return { success: true, message: 'Categoria arquivada', data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    // ── ITENS DO CARDÁPIO ──────────────────────────────────────────────────
    .get('/menu/items', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'viewer');
        if (guard) return guard;

        try {
            const { appKey, categoryId, status = 'active', page = '1', limit = '50' } = ctx.query as Record<string, string>;
            const filter: Record<string, any> = { appKey };
            if (status !== 'all') filter.status = status;
            if (categoryId) filter.categoryId = categoryId;

            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
            const skip = (pageNum - 1) * limitNum;

            const [data, total] = await Promise.all([
                mRestaurantMenuItem.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum),
                mRestaurantMenuItem.countDocuments(filter),
            ]);

            return { success: true, data, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .get('/menu/items/:uuid', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'viewer');
        if (guard) return guard;

        try {
            const data = await mRestaurantMenuItem.findOne({ uuid: ctx.params.uuid, appKey: ctx.query.appKey });
            if (!data) { ctx.set.status = 404; return { success: false, error: 'Item não encontrado' }; }
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .post('/menu/items', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const body = ctx.body as any;
            if (!body.appKey || !body.name || body.price === undefined) {
                ctx.set.status = 400;
                return { success: false, error: 'appKey, name e price são obrigatórios' };
            }
            const uuid = crypto.randomUUID();
            const slug = body.slug ? toSlug(body.slug) : slugWithUuid(body.name, uuid);
            const existing = await mRestaurantMenuItem.findOne({ appKey: body.appKey, slug });
            if (existing) { ctx.set.status = 409; return { success: false, error: `Slug "${slug}" já existe` }; }

            const data = await mRestaurantMenuItem.create({ ...body, uuid, slug });
            ctx.set.status = 201;
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .put('/menu/items/:uuid', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const body = ctx.body as any;
            delete body.uuid;
            delete body.appKey;
            if (body.slug) body.slug = toSlug(body.slug);

            const data = await mRestaurantMenuItem.findOneAndUpdate(
                { uuid: ctx.params.uuid, appKey: ctx.query.appKey },
                { $set: body },
                { new: true, runValidators: true }
            );
            if (!data) { ctx.set.status = 404; return { success: false, error: 'Item não encontrado' }; }
            return { success: true, data };
        } catch (error: any) {
            if (error.code === 11000) { ctx.set.status = 409; return { success: false, error: 'Slug já em uso' }; }
            return handleError(ctx.set, error);
        }
    })

    .delete('/menu/items/:uuid', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const data = await mRestaurantMenuItem.findOneAndUpdate(
                { uuid: ctx.params.uuid, appKey: ctx.query.appKey },
                { $set: { status: 'archived' } },
                { new: true }
            );
            if (!data) { ctx.set.status = 404; return { success: false, error: 'Item não encontrado' }; }
            return { success: true, message: 'Item arquivado', data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    // ── INGREDIENTES ───────────────────────────────────────────────────────
    .get('/ingredients', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'viewer');
        if (guard) return guard;

        try {
            const { appKey, status = 'active', lowStock } = ctx.query as Record<string, string>;
            if (lowStock === 'true') {
                const data = await getLowStockIngredients(appKey);
                return { success: true, data };
            }
            const filter: Record<string, any> = { appKey };
            if (status !== 'all') filter.status = status;
            const data = await mRestaurantIngredient.find(filter).sort({ name: 1 });
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .post('/ingredients', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const body = ctx.body as any;
            if (!body.appKey || !body.name) {
                ctx.set.status = 400;
                return { success: false, error: 'appKey e name são obrigatórios' };
            }
            const uuid = crypto.randomUUID();
            const data = await mRestaurantIngredient.create({ ...body, uuid });
            ctx.set.status = 201;
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .put('/ingredients/:uuid', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const body = ctx.body as any;
            delete body.uuid;
            delete body.appKey;
            const data = await mRestaurantIngredient.findOneAndUpdate(
                { uuid: ctx.params.uuid, appKey: ctx.query.appKey },
                { $set: body },
                { new: true, runValidators: true }
            );
            if (!data) { ctx.set.status = 404; return { success: false, error: 'Ingrediente não encontrado' }; }
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .delete('/ingredients/:uuid', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const data = await mRestaurantIngredient.findOneAndUpdate(
                { uuid: ctx.params.uuid, appKey: ctx.query.appKey },
                { $set: { status: 'archived' } },
                { new: true }
            );
            if (!data) { ctx.set.status = 404; return { success: false, error: 'Ingrediente não encontrado' }; }
            return { success: true, message: 'Ingrediente arquivado', data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .post('/ingredients/:uuid/adjust', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const { quantity, reason } = ctx.body as any;
            if (quantity === undefined) {
                ctx.set.status = 400;
                return { success: false, error: 'quantity é obrigatório' };
            }
            const result = await adjustStock(ctx.query.appKey, ctx.params.uuid, Number(quantity), reason);
            if (!result) { ctx.set.status = 404; return { success: false, error: 'Ingrediente não encontrado' }; }
            return { success: true, data: result };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    // ── MESAS ──────────────────────────────────────────────────────────────
    .get('/tables', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'viewer');
        if (guard) return guard;

        try {
            const { appKey, status = 'all' } = ctx.query as Record<string, string>;
            const filter: Record<string, any> = { appKey };
            if (status !== 'all') filter.status = status;
            const data = await mRestaurantTable.find(filter).sort({ number: 1 });
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .post('/tables', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const body = ctx.body as any;
            if (!body.appKey || !body.number) {
                ctx.set.status = 400;
                return { success: false, error: 'appKey e number são obrigatórios' };
            }
            const uuid = crypto.randomUUID();
            const data = await mRestaurantTable.create({ ...body, uuid });
            ctx.set.status = 201;
            return { success: true, data };
        } catch (error: any) {
            if (error.code === 11000) { ctx.set.status = 409; return { success: false, error: 'Mesa já existe' }; }
            return handleError(ctx.set, error);
        }
    })

    .put('/tables/:uuid', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const body = ctx.body as any;
            delete body.uuid;
            delete body.appKey;
            const data = await mRestaurantTable.findOneAndUpdate(
                { uuid: ctx.params.uuid, appKey: ctx.query.appKey },
                { $set: body },
                { new: true, runValidators: true }
            );
            if (!data) { ctx.set.status = 404; return { success: false, error: 'Mesa não encontrada' }; }
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .delete('/tables/:uuid', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const data = await mRestaurantTable.findOneAndUpdate(
                { uuid: ctx.params.uuid, appKey: ctx.query.appKey },
                { $set: { status: 'inactive' } },
                { new: true }
            );
            if (!data) { ctx.set.status = 404; return { success: false, error: 'Mesa não encontrada' }; }
            return { success: true, message: 'Mesa inativada', data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    // ── PEDIDOS ────────────────────────────────────────────────────────────
    .get('/orders', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'viewer');
        if (guard) return guard;

        try {
            const { appKey, status = 'all', page = '1', limit = '50' } = ctx.query as Record<string, string>;
            const filter: Record<string, any> = { appKey };
            if (status !== 'all') filter.status = status;

            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
            const skip = (pageNum - 1) * limitNum;

            const [data, total] = await Promise.all([
                mRestaurantOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
                mRestaurantOrder.countDocuments(filter),
            ]);

            return { success: true, data, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .get('/orders/:uuid', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'viewer');
        if (guard) return guard;

        try {
            const data = await mRestaurantOrder.findOne({ uuid: ctx.params.uuid, appKey: ctx.query.appKey });
            if (!data) { ctx.set.status = 404; return { success: false, error: 'Pedido não encontrado' }; }
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .post('/orders', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const body = ctx.body as any;
            if (!body.appKey) {
                ctx.set.status = 400;
                return { success: false, error: 'appKey é obrigatório' };
            }
            const uuid = crypto.randomUUID();
            const order = await mRestaurantOrder.create({
                uuid,
                appKey: body.appKey,
                tableId: body.tableId,
                orderType: body.orderType ?? 'dine_in',
                items: [],
                subtotal: 0,
                total: 0,
                serviceFee: body.serviceFee ?? 0,
                discount: body.discount ?? 0,
                status: 'open',
                paymentStatus: 'pending',
                createdBy: ctx.user?.sub ?? 'system',
            });

            await updateTableStatusOnOrderOpen(body.appKey, body.tableId);
            ctx.set.status = 201;
            return { success: true, data: order };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .post('/orders/:uuid/items', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const order = await mRestaurantOrder.findOne({ uuid: ctx.params.uuid, appKey: ctx.query.appKey });
            if (!order) { ctx.set.status = 404; return { success: false, error: 'Pedido não encontrado' }; }
            if (order.status !== 'open') { ctx.set.status = 400; return { success: false, error: 'Pedido não está aberto' }; }

            const body = ctx.body as any;
            if (!body.menuItemId || !body.quantity || body.quantity < 1) {
                ctx.set.status = 400;
                return { success: false, error: 'menuItemId e quantity são obrigatórios' };
            }

            const result = await addItemToOrder(order, body.menuItemId, Number(body.quantity), {
                variationId: body.variationId,
                addOnNames: body.addOnNames,
                notes: body.notes,
            });

            if (result.error) { ctx.set.status = 400; return { success: false, error: result.error }; }
            return { success: true, data: result.order };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .delete('/orders/:uuid/items/:itemId', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const order = await mRestaurantOrder.findOne({ uuid: ctx.params.uuid, appKey: ctx.query.appKey });
            if (!order) { ctx.set.status = 404; return { success: false, error: 'Pedido não encontrado' }; }
            if (order.status !== 'open') { ctx.set.status = 400; return { success: false, error: 'Pedido não está aberto' }; }

            const result = await removeItemFromOrder(order, ctx.params.itemId);
            if (result.error) { ctx.set.status = 404; return { success: false, error: result.error }; }
            return { success: true, data: result.order };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .patch('/orders/:uuid/status', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const { status } = ctx.body as any;
            if (!status) {
                ctx.set.status = 400;
                return { success: false, error: 'status é obrigatório' };
            }
            const order = await mRestaurantOrder.findOne({ uuid: ctx.params.uuid, appKey: ctx.query.appKey });
            if (!order) { ctx.set.status = 404; return { success: false, error: 'Pedido não encontrado' }; }
            if (order.status === 'closed' || order.status === 'canceled') {
                ctx.set.status = 400;
                return { success: false, error: 'Pedido fechado ou cancelado não pode ter status alterado' };
            }

            order.status = status;
            await order.save();
            return { success: true, data: order };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .post('/orders/:uuid/close', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const order = await mRestaurantOrder.findOne({ uuid: ctx.params.uuid, appKey: ctx.query.appKey });
            if (!order) { ctx.set.status = 404; return { success: false, error: 'Pedido não encontrado' }; }

            const result = await closeOrder(order);
            if (result.error) { ctx.set.status = 400; return { success: false, error: result.error, missing: result.missing }; }
            return { success: true, data: result.order };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .delete('/orders/:uuid', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'editor');
        if (guard) return guard;

        try {
            const order = await mRestaurantOrder.findOne({ uuid: ctx.params.uuid, appKey: ctx.query.appKey });
            if (!order) { ctx.set.status = 404; return { success: false, error: 'Pedido não encontrado' }; }
            if (order.status === 'closed') { ctx.set.status = 400; return { success: false, error: 'Pedido fechado não pode ser cancelado' }; }

            order.status = 'canceled';
            if (order.tableId) {
                await mRestaurantTable.findOneAndUpdate(
                    { appKey: order.appKey, uuid: order.tableId },
                    { status: 'free' }
                );
            }
            await order.save();
            return { success: true, message: 'Pedido cancelado', data: order };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    // ── RELATÓRIOS ─────────────────────────────────────────────────────────
    .get('/reports/daily', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'viewer');
        if (guard) return guard;

        try {
            const { appKey, date } = ctx.query as Record<string, string>;
            const data = await getDailyReport(appKey, date);
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    })

    .get('/reports/top-items', async (ctx: any) => {
        const guard = await checkTenantAccess(ctx, 'viewer');
        if (guard) return guard;

        try {
            const { appKey, date, limit = '10' } = ctx.query as Record<string, string>;
            const data = await getTopItemsReport(appKey, date, parseInt(limit));
            return { success: true, data };
        } catch (error: any) { return handleError(ctx.set, error); }
    });
