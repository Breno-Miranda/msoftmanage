import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { signAccessToken } from '../src/config/jwt';
import { mAuth } from '../src/models/mAuth';
import { mRestaurantMenuCategory } from '../src/models/mRestaurantMenuCategory';
import { mRestaurantMenuItem } from '../src/models/mRestaurantMenuItem';
import { mRestaurantIngredient } from '../src/models/mRestaurantIngredient';
import { mRestaurantTable } from '../src/models/mRestaurantTable';
import { mRestaurantOrder } from '../src/models/mRestaurantOrder';

const BASE_URL = 'http://localhost:3000/restaurant';
const TEST_APP_KEY = 'restaurant-test';

if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/bun-api-test';
}

async function authHeader() {
    const user = await mAuth.findOne({ email: 'admin@restaurant-test.dev' });
    const token = signAccessToken({
        sub: user!._id.toString(),
        email: user!.email,
        roles: ['admin'],
        tokenVersion: user!.tokenVersion,
    });
    return `Bearer ${token}`;
}

async function jsonRequest(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
        Authorization: await authHeader(),
    };
    if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const separator = path.includes('?') ? '&' : '?';
    const url = `${BASE_URL}${path}${separator}appKey=${TEST_APP_KEY}`;

    const response = await app.handle(new Request(url, { ...options, headers }));
    return { response, data: await response.json() };
}

describe('Restaurant Module', () => {
    beforeAll(async () => {
        await db.connect();

        await mAuth.deleteOne({ email: 'admin@restaurant-test.dev' });
        await mAuth.create({
            name: 'Restaurant Admin',
            email: 'admin@restaurant-test.dev',
            password: await Bun.password.hash('test123', { algorithm: 'argon2id' }),
            roles: ['admin'],
            status: 'active',
            tokenVersion: 1,
            provider: 'local',
        });

        await mRestaurantMenuCategory.deleteMany({ appKey: TEST_APP_KEY });
        await mRestaurantMenuItem.deleteMany({ appKey: TEST_APP_KEY });
        await mRestaurantIngredient.deleteMany({ appKey: TEST_APP_KEY });
        await mRestaurantTable.deleteMany({ appKey: TEST_APP_KEY });
        await mRestaurantOrder.deleteMany({ appKey: TEST_APP_KEY });
    });

    afterAll(async () => {
        await mAuth.deleteOne({ email: 'admin@restaurant-test.dev' });
        await db.disconnect();
    });

    it('should create a menu category', async () => {
        const { response, data } = await jsonRequest('/menu/categories', {
            method: 'POST',
            body: JSON.stringify({ appKey: TEST_APP_KEY, name: 'Bebidas', sortOrder: 1 }),
        });

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.name).toBe('Bebidas');
    });

    it('should list menu categories', async () => {
        const { response, data } = await jsonRequest('/menu/categories');

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.length).toBeGreaterThan(0);
    });

    it('should create a menu item with recipe', async () => {
        const ingredient = await mRestaurantIngredient.create({
            uuid: crypto.randomUUID(),
            appKey: TEST_APP_KEY,
            name: 'Hambúrguer',
            unit: 'unidade',
            stock: 100,
            minStock: 10,
        });

        const { response, data } = await jsonRequest('/menu/items', {
            method: 'POST',
            body: JSON.stringify({
                appKey: TEST_APP_KEY,
                name: 'X-Burger',
                price: 25,
                categoryId: null,
                recipe: [{ ingredientId: ingredient.uuid, quantity: 1 }],
            }),
        });

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.name).toBe('X-Burger');
        expect(data.data.recipe.length).toBe(1);
    });

    it('should create a table', async () => {
        const { response, data } = await jsonRequest('/tables', {
            method: 'POST',
            body: JSON.stringify({ appKey: TEST_APP_KEY, number: '01', capacity: 4 }),
        });

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.number).toBe('01');
    });

    it('should open an order', async () => {
        const table = await mRestaurantTable.findOne({ appKey: TEST_APP_KEY, number: '01' });

        const { response, data } = await jsonRequest('/orders', {
            method: 'POST',
            body: JSON.stringify({ appKey: TEST_APP_KEY, tableId: table!.uuid, orderType: 'dine_in' }),
        });

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe('open');
    });

    it('should add item to order and close it decreasing stock', async () => {
        const order = await mRestaurantOrder.findOne({ appKey: TEST_APP_KEY, status: 'open' });
        const item = await mRestaurantMenuItem.findOne({ appKey: TEST_APP_KEY, name: 'X-Burger' });

        const addRes = await jsonRequest(`/orders/${order!.uuid}/items`, {
            method: 'POST',
            body: JSON.stringify({ menuItemId: item!.uuid, quantity: 2 }),
        });

        expect(addRes.response.status).toBe(200);
        expect(addRes.data.success).toBe(true);
        expect(addRes.data.data.items.length).toBe(1);
        expect(addRes.data.data.total).toBe(50);

        const closeRes = await jsonRequest(`/orders/${order!.uuid}/close`, { method: 'POST' });
        expect(closeRes.response.status).toBe(200);
        expect(closeRes.data.success).toBe(true);
        expect(closeRes.data.data.status).toBe('closed');

        const ingredient = await mRestaurantIngredient.findOne({ appKey: TEST_APP_KEY, name: 'Hambúrguer' });
        expect(ingredient!.stock).toBe(98);
    });

    it('should block closing order when stock is insufficient', async () => {
        const ingredient = await mRestaurantIngredient.findOne({ appKey: TEST_APP_KEY, name: 'Hambúrguer' });
        ingredient!.stock = 0;
        await ingredient!.save();

        const table = await mRestaurantTable.findOne({ appKey: TEST_APP_KEY, number: '01' });
        const item = await mRestaurantMenuItem.findOne({ appKey: TEST_APP_KEY, name: 'X-Burger' });

        const openRes = await jsonRequest('/orders', {
            method: 'POST',
            body: JSON.stringify({ appKey: TEST_APP_KEY, tableId: table!.uuid }),
        });

        const order = openRes.data.data;

        await jsonRequest(`/orders/${order.uuid}/items`, {
            method: 'POST',
            body: JSON.stringify({ menuItemId: item!.uuid, quantity: 1 }),
        });

        const closeRes = await jsonRequest(`/orders/${order.uuid}/close`, { method: 'POST' });
        expect(closeRes.response.status).toBe(400);
        expect(closeRes.data.success).toBe(false);
        expect(closeRes.data.error).toBe('Estoque insuficiente');
    });

    it('should return daily report', async () => {
        const { response, data } = await jsonRequest('/reports/daily');

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.totalOrders).toBeGreaterThan(0);
        expect(data.data.totalSales).toBeGreaterThan(0);
    });
});
