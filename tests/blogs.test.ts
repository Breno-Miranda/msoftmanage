import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { mBlog } from '../src/models/mBlogs';

// Garantir URI para testes se não estiver definida no ENV (Fallback test database local)
if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/bun-api-test';
}

describe('Blogs API', () => {
    let createdBlogId: string;
    let createdBlogSlug: string;

    beforeAll(async () => {
        // Usa o wrapper de Conexão Múltipla configurado em config/database.ts se não houver singleton global
        await db.connect();
        
        // Limpar sujeira antes dos testes na base Fake/Dev
        await mBlog.deleteMany({});
    });

    afterAll(async () => {
        // Limpar as instâncias geradas durante o teste
        await mBlog.deleteMany({});
        await db.disconnect();
    });

    test('GET /blogs deve retornar lista vazia (inicialmente) sob status de publicadas', async () => {
        const response = await app.handle(new Request('http://localhost:3000/blogs'));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });

    test('POST /blogs deve criar nova postagem com sucesso via Mongoose validation flexivel', async () => {
        const blogPayload = {
            title: 'Test Blog Post Integration',
            slug: 'test-blog-integration-' + Date.now().toString(),
            content: '<p>Este post comprova o fluxo Unitário 100%.</p>',
            author: 'Antigravity Test Suite',
            category: 'Testing CI/CD',
            published: true,
            featured: true
        };

        const response = await app.handle(
            new Request('http://localhost:3000/blogs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blogPayload)
            })
        );
        const data = await response.json();

        expect(response.status).toBe(200); 
        expect(data.success).toBe(true);
        expect(data.data.title).toBe(blogPayload.title);
        
        createdBlogId = data.data._id;
        createdBlogSlug = data.data.slug;
    });

    test('GET /blogs/all deve retornar as listagens preenchidas aos Adms', async () => {
        const response = await app.handle(new Request('http://localhost:3000/blogs/all'));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.length).toBeGreaterThan(0);
    });

    test('GET /blogs/:slug deve buscar perfeitamente a leitura pelo slug publico e incrementar Views', async () => {
        const response = await app.handle(new Request(`http://localhost:3000/blogs/${createdBlogSlug}`));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.title).toBe('Test Blog Post Integration');
        expect(data.data.views).toBeGreaterThanOrEqual(1);
    });

    test('POST /blogs repulsa de forma íntegra faltando restrições críticas do Mongoose', async () => {
        const invalidPayload = {
            title: 'Ilegal (Sem Slug, Content e Author)'
        };

        const response = await app.handle(
            new Request('http://localhost:3000/blogs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invalidPayload)
            })
        );
        const data = await response.json();

        // Elyssia capta status 500 no fallback da rota customizada para mongoose error
        expect(response.status).toBe(500); 
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined(); // Contagem do Mongo Exception
    });

    test('DELETE /blogs/:id limpa post preexistente da persistência', async () => {
        const response = await app.handle(
            new Request(`http://localhost:3000/blogs/${createdBlogId}`, {
                method: 'DELETE'
            })
        );
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Post removido');
    });
});
