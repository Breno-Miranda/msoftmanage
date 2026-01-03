import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { app } from '../src/app';
import { db } from '../src/config/database';

// Garantir URI para testes se não estiver definida
if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/bun-api-test';
}

describe('Credentials API', () => {
    beforeAll(async () => {
        await db.connect();
    });

    afterAll(async () => {
        await db.disconnect();
    });

    test('GET /credentials deve retornar lista vazia ou populada', async () => {
        const response = await app.handle(new Request('http://localhost:3000/credentials'));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.pagination).toBeDefined();
    });

    test('POST /credentials deve criar nova credencial', async () => {
        const credentialData = {
            service: 'Test Service',
            username: 'test_user',
            password: 'secure_password'
        };

        const response = await app.handle(
            new Request('http://localhost:3000/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentialData)
            })
        );
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.service).toBe(credentialData.service);
        expect(data.data.username).toBe(credentialData.username);
    });
});
