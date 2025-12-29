import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
// import app from '../src/index'; // Comentado: servidor inicia automaticamente

/**
 * Testes de exemplo para a API
 * Para rodar: bun test
 */

describe('API Health Check', () => {
    test('GET / deve retornar status OK', async () => {
        const response = await app.handle(new Request('http://localhost:3000/'));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('funcionando');
    });

    test('GET /health deve retornar status do banco', async () => {
        const response = await app.handle(new Request('http://localhost:3000/health'));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.database).toBeDefined();
    });
});

describe('Products API', () => {
    let createdProductId: string;

    test('POST /products deve criar um novo produto', async () => {
        const productData = {
            name: 'Produto de Teste',
            price: 99.99,
            stock: 10,
            description: 'Produto criado durante teste',
            category: 'Outros',
        };

        const response = await app.handle(
            new Request('http://localhost:3000/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            })
        );

        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.name).toBe(productData.name);
        expect(data.data.price).toBe(productData.price);

        createdProductId = data.data.id;
    });

    test('GET /products deve listar produtos', async () => {
        const response = await app.handle(
            new Request('http://localhost:3000/products')
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.pagination).toBeDefined();
    });

    test('GET /products/:id deve retornar produto específico', async () => {
        if (!createdProductId) {
            test.skip();
            return;
        }

        const response = await app.handle(
            new Request(`http://localhost:3000/products/${createdProductId}`)
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.id).toBe(createdProductId);
    });

    test('PATCH /products/:id deve atualizar produto', async () => {
        if (!createdProductId) {
            test.skip();
            return;
        }

        const updateData = {
            price: 149.99,
        };

        const response = await app.handle(
            new Request(`http://localhost:3000/products/${createdProductId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            })
        );

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.price).toBe(updateData.price);
    });

    test('DELETE /products/:id deve remover produto', async () => {
        if (!createdProductId) {
            test.skip();
            return;
        }

        const response = await app.handle(
            new Request(`http://localhost:3000/products/${createdProductId}`, {
                method: 'DELETE',
            })
        );

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    test('POST /products deve validar dados obrigatórios', async () => {
        const invalidData = {
            name: 'AB', // Nome muito curto
        };

        const response = await app.handle(
            new Request('http://localhost:3000/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(invalidData),
            })
        );

        expect(response.status).toBe(400);
    });
});
