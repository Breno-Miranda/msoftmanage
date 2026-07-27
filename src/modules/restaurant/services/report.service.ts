import { mRestaurantOrder } from '../../../models/mRestaurantOrder';

function startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

export async function getDailyReport(appKey: string, date?: string) {
    const referenceDate = date ? new Date(date) : new Date();
    const start = startOfDay(referenceDate);
    const end = endOfDay(referenceDate);

    const orders = await mRestaurantOrder.find({
        appKey,
        status: 'closed',
        closedAt: { $gte: start, $lte: end },
    });

    const totalSales = orders.reduce((sum, order) => sum + (order.total ?? 0), 0);
    const totalOrders = orders.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
        date: start.toISOString().split('T')[0],
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders,
        averageTicket: Math.round(averageTicket * 100) / 100,
    };
}

export async function getTopItemsReport(appKey: string, date?: string, limit = 10) {
    const referenceDate = date ? new Date(date) : new Date();
    const start = startOfDay(referenceDate);
    const end = endOfDay(referenceDate);

    const orders = await mRestaurantOrder.find({
        appKey,
        status: 'closed',
        closedAt: { $gte: start, $lte: end },
    });

    const itemMap = new Map<string, { name: string; quantity: number; totalRevenue: number }>();

    for (const order of orders) {
        for (const item of order.items) {
            const existing = itemMap.get(item.menuItemId) ?? { name: item.menuItemId, quantity: 0, totalRevenue: 0 };
            existing.quantity += item.quantity;
            existing.totalRevenue += item.totalPrice;
            itemMap.set(item.menuItemId, existing);
        }
    }

    return Array.from(itemMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit)
        .map(item => ({
            ...item,
            totalRevenue: Math.round(item.totalRevenue * 100) / 100,
        }));
}
