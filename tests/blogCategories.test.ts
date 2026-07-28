import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
import { blogRoutes } from '../src/routes/blogs';
import { db } from '../src/config/database';
import { signAccessToken } from '../src/config/jwt';
import { mAuth } from '../src/models/mAuth';
import { mBlogCategory } from '../src/models/mBlogCategory';

// Mesmo padrao do catalog.test.ts: instancia propria, sem depender do app.ts legado.
const app = new Elysia().use(blogRoutes);

// Use test database
if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/bun-api-test';
}

describe('Blog Categories API', () => {
    const runId = Date.now();
    const authorEmail = `blogcat_${runId}@msoft.com.br`;
    const catName = `Categoria Teste ${runId}`;
    const renamedCat = `Categoria Renomeada ${runId}`;
    let token = '';
    let categoryId = '';

    const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };

    beforeAll(async () => {
        await db.connect();
        await mAuth.deleteMany({ email: authorEmail });
        await mBlogCategory.deleteMany({ name: { $in: [catName, renamedCat] } });

        const password = await Bun.password.hash('blogcat-password-123', { algorithm: 'argon2id' });
        const author = await mAuth.create({
            name: 'Blog Category Test',
            email: authorEmail,
            password,
            roles: ['admin'],
            status: 'active',
            provider: 'local',
        });
        token = signAccessToken({ sub: author.id, email: author.email, roles: author.roles, tokenVersion: author.tokenVersion });
        authHeaders.Authorization = `Bearer ${token}`;
    });

    afterAll(async () => {
        await mAuth.deleteMany({ email: authorEmail });
        await mBlogCategory.deleteMany({ name: { $in: [catName, renamedCat] } });
        await db.disconnect();
    });

    test('GET /blogs/categories is public and seeds the default categories', async () => {
        await mBlogCategory.deleteMany({});

        const response = await app.handle(new Request('http://localhost:3000/blogs/categories'));
        const data: any = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        const names = data.data.map((cat: any) => cat.name);
        for (const expected of ['Tecnologia', 'White Label', 'Produtividade', 'Design', 'Negócios']) {
            expect(names).toContain(expected);
        }
    });

    test('POST /blogs/categories rejects requests without authentication', async () => {
        const response = await app.handle(
            new Request('http://localhost:3000/blogs/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: catName }),
            })
        );

        expect(response.status).toBe(401);
        expect(await mBlogCategory.findOne({ name: catName })).toBeNull();
    });

    test('POST /blogs/categories creates a category', async () => {
        const response = await app.handle(
            new Request('http://localhost:3000/blogs/categories', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ name: catName }),
            })
        );
        const data: any = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.name).toBe(catName);
        categoryId = String(data.data._id);
    });

    test('POST /blogs/categories rejects duplicated names ignoring case', async () => {
        const response = await app.handle(
            new Request('http://localhost:3000/blogs/categories', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ name: catName.toUpperCase() }),
            })
        );
        const data: any = await response.json();

        expect(response.status).toBe(409);
        expect(data.success).toBe(false);
        expect(await mBlogCategory.countDocuments({ name: new RegExp(`^${catName}$`, 'i') })).toBe(1);
    });

    test('POST /blogs/categories validates the name', async () => {
        const response = await app.handle(
            new Request('http://localhost:3000/blogs/categories', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ name: '   ' }),
            })
        );

        expect(response.status).toBe(400);
    });

    test('PUT /blogs/categories/:id renames a category', async () => {
        const response = await app.handle(
            new Request(`http://localhost:3000/blogs/categories/${categoryId}`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({ name: renamedCat }),
            })
        );
        const data: any = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.name).toBe(renamedCat);
    });

    test('PUT /blogs/categories/:id returns 404 for an unknown id', async () => {
        const response = await app.handle(
            new Request('http://localhost:3000/blogs/categories/64b7f9c2d1e2f3a4b5c6d7e8', {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({ name: 'Outro Nome' }),
            })
        );

        expect(response.status).toBe(404);
    });

    test('DELETE /blogs/categories/:id removes a category', async () => {
        const response = await app.handle(
            new Request(`http://localhost:3000/blogs/categories/${categoryId}`, {
                method: 'DELETE',
                headers: authHeaders,
            })
        );
        const data: any = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(await mBlogCategory.findById(categoryId)).toBeNull();
    });

    test('DELETE /blogs/categories/:id returns 404 for an unknown id', async () => {
        const response = await app.handle(
            new Request('http://localhost:3000/blogs/categories/64b7f9c2d1e2f3a4b5c6d7e8', {
                method: 'DELETE',
                headers: authHeaders,
            })
        );

        expect(response.status).toBe(404);
    });
});
