import { mRestaurantMenuItem } from '../../../models/mRestaurantMenuItem';
import { mRestaurantOrder, IOrderItem } from '../../../models/mRestaurantOrder';
import { mRestaurantTable } from '../../../models/mRestaurantTable';
import { decreaseStockForRecipe, validateRecipeStock } from './stock.service';

function roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
}

function calculateItemPrice(menuItem: any, variationId?: string, addOnNames: string[] = []): number {
    let price = menuItem.price ?? 0;

    if (variationId && menuItem.variations) {
        const variation = menuItem.variations.find((v: any) => (v._id ? v._id.toString() : v.name) === variationId);
        if (variation) price = variation.price;
    }

    if (addOnNames.length && menuItem.addOns) {
        for (const addOnName of addOnNames) {
            const addOn = menuItem.addOns.find((a: any) => a.name === addOnName);
            if (addOn) price += addOn.price;
        }
    }

    return price;
}

function buildAddOns(menuItem: any, addOnNames: string[] = []): { name: string; price: number }[] {
    if (!addOnNames.length || !menuItem.addOns) return [];

    return addOnNames
        .map(name => {
            const addOn = menuItem.addOns.find((a: any) => a.name === name);
            return addOn ? { name: addOn.name, price: addOn.price } : null;
        })
        .filter(Boolean) as { name: string; price: number }[];
}

export async function calculateOrderTotals(order: any) {
    const subtotal = order.items.reduce((sum: number, item: IOrderItem) => sum + (item.totalPrice ?? 0), 0);
    const serviceFeeAmount = roundCurrency(subtotal * (order.serviceFee ?? 0) / 100);
    const total = roundCurrency(subtotal + serviceFeeAmount - (order.discount ?? 0));

    return { subtotal: roundCurrency(subtotal), total };
}

export async function addItemToOrder(
    order: any,
    menuItemId: string,
    quantity: number,
    options: { variationId?: string; addOnNames?: string[]; notes?: string }
) {
    const menuItem = await mRestaurantMenuItem.findOne({
        uuid: menuItemId,
        appKey: order.appKey,
        status: { $ne: 'archived' },
    });

    if (!menuItem) return { error: 'Item do cardápio não encontrado' };

    const unitPrice = calculateItemPrice(menuItem, options.variationId, options.addOnNames);
    const addOns = buildAddOns(menuItem, options.addOnNames);
    const totalPrice = roundCurrency(unitPrice * quantity);

    const item: IOrderItem = {
        itemId: crypto.randomUUID(),
        menuItemId: menuItem.uuid,
        variationId: options.variationId,
        addOns,
        quantity,
        unitPrice,
        totalPrice,
        notes: options.notes,
    };

    order.items.push(item);
    const totals = await calculateOrderTotals(order);
    order.subtotal = totals.subtotal;
    order.total = totals.total;

    await order.save();
    return { item, order };
}

export async function removeItemFromOrder(order: any, itemId: string) {
    const originalLength = order.items.length;
    order.items = order.items.filter((item: IOrderItem) => item.itemId !== itemId);

    if (order.items.length === originalLength) {
        return { error: 'Item não encontrado no pedido' };
    }

    const totals = await calculateOrderTotals(order);
    order.subtotal = totals.subtotal;
    order.total = totals.total;

    await order.save();
    return { order };
}

export async function closeOrder(order: any) {
    if (order.status === 'closed') return { error: 'Pedido já está fechado' };
    if (order.status === 'canceled') return { error: 'Pedido cancelado não pode ser fechado' };

    const recipeMap = new Map<string, number>();

    for (const item of order.items) {
        const menuItem = await mRestaurantMenuItem.findOne({
            uuid: item.menuItemId,
            appKey: order.appKey,
        });

        if (menuItem && menuItem.recipe && menuItem.recipe.length > 0) {
            for (const recipeItem of menuItem.recipe) {
                const current = recipeMap.get(recipeItem.ingredientId) ?? 0;
                recipeMap.set(recipeItem.ingredientId, current + recipeItem.quantity * item.quantity);
            }
        }
    }

    const recipe = Array.from(recipeMap.entries()).map(([ingredientId, quantity]) => ({ ingredientId, quantity }));
    const stockCheck = await validateRecipeStock(order.appKey, recipe, 1);
    if (!stockCheck.ok) {
        return { error: 'Estoque insuficiente', missing: stockCheck.missing };
    }

    await decreaseStockForRecipe(order.appKey, recipe, 1);

    const totals = await calculateOrderTotals(order);
    order.subtotal = totals.subtotal;
    order.total = totals.total;
    order.status = 'closed';
    order.paymentStatus = 'paid';
    order.closedAt = new Date();

    if (order.tableId) {
        await mRestaurantTable.findOneAndUpdate(
            { appKey: order.appKey, uuid: order.tableId },
            { status: 'free' }
        );
    }

    await order.save();
    return { order };
}

export async function updateTableStatusOnOrderOpen(appKey: string, tableId?: string) {
    if (!tableId) return;
    await mRestaurantTable.findOneAndUpdate(
        { appKey, uuid: tableId },
        { status: 'occupied' }
    );
}
