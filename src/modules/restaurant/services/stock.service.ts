import { mRestaurantIngredient } from '../../../models/mRestaurantIngredient';
import { mRestaurantMenuItem } from '../../../models/mRestaurantMenuItem';

export async function validateRecipeStock(appKey: string, recipe: { ingredientId: string; quantity: number }[], multiplier: number) {
    if (!recipe || recipe.length === 0) return { ok: true, missing: [] };

    const ingredientIds = recipe.map(r => r.ingredientId);
    const ingredients = await mRestaurantIngredient.find({
        appKey,
        uuid: { $in: ingredientIds },
        status: { $ne: 'archived' },
    });

    const missing: { ingredientId: string; name: string; required: number; available: number }[] = [];

    for (const item of recipe) {
        const ingredient = ingredients.find(i => i.uuid === item.ingredientId);
        const required = item.quantity * multiplier;
        const available = ingredient?.stock ?? 0;
        if (available < required) {
            missing.push({
                ingredientId: item.ingredientId,
                name: ingredient?.name ?? item.ingredientId,
                required,
                available,
            });
        }
    }

    return { ok: missing.length === 0, missing };
}

export async function decreaseStockForRecipe(appKey: string, recipe: { ingredientId: string; quantity: number }[], multiplier: number) {
    if (!recipe || recipe.length === 0) return;

    for (const item of recipe) {
        await mRestaurantIngredient.findOneAndUpdate(
            { appKey, uuid: item.ingredientId },
            { $inc: { stock: -(item.quantity * multiplier) } }
        );
    }
}

export async function increaseStockForRecipe(appKey: string, recipe: { ingredientId: string; quantity: number }[], multiplier: number) {
    if (!recipe || recipe.length === 0) return;

    for (const item of recipe) {
        await mRestaurantIngredient.findOneAndUpdate(
            { appKey, uuid: item.ingredientId },
            { $inc: { stock: item.quantity * multiplier } }
        );
    }
}

export async function adjustStock(appKey: string, ingredientId: string, quantity: number, reason?: string) {
    const ingredient = await mRestaurantIngredient.findOneAndUpdate(
        { appKey, uuid: ingredientId },
        { $inc: { stock: quantity } },
        { new: true }
    );

    if (!ingredient) return null;

    return {
        ingredient,
        adjustment: quantity,
        reason: reason ?? 'manual',
    };
}

export async function getLowStockIngredients(appKey: string) {
    return mRestaurantIngredient.find({
        appKey,
        status: { $ne: 'archived' },
        $expr: { $lte: ['$stock', '$minStock'] },
    });
}

export async function getRecipesForItems(menuItemIds: string[], appKey: string) {
    const items = await mRestaurantMenuItem.find({
        appKey,
        uuid: { $in: menuItemIds },
        status: { $ne: 'archived' },
    });

    return new Map(items.map(item => [item.uuid, item.recipe]));
}
