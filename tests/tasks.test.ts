import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { app } from '../src/app';
import { db } from '../src/config/database';

// Garantir URI para testes se não estiver definida
if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/bun-api-test';
}

describe('Tasks API', () => {
    beforeAll(async () => {
        await db.connect();
    });

    afterAll(async () => {
        await db.disconnect();
    });

    test('GET /tasks deve retornar lista vazia ou populada', async () => {
        const response = await app.handle(new Request('http://localhost:3000/tasks'));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.pagination).toBeDefined();
    });

    test('POST /tasks deve criar nova tarefa', async () => {
        const taskData = {
            title: 'Test Task',
            description: 'Task created specifically for testing purposes',
            status: 'pending'
        };

        const response = await app.handle(
            new Request('http://localhost:3000/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            })
        );
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.title).toBe(taskData.title);
        expect(data.data.description).toBe(taskData.description);
    });
});
