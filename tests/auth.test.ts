import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { mAuth } from '../src/models/mAuth';

// Use test database
if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/bun-api-test';
}

describe('Auth API', () => {
    // Unique email for this test run to avoid collision
    const testUser = {
        name: 'Test User',
        email: `test_${Date.now()}@msoft.com.br`,
        password: 'password123',
        role: 'user'
    };

    beforeAll(async () => {
        await db.connect();
        // Clean up any existing test user with same email (unlikely due to timestamp but safe)
        await mAuth.deleteOne({ email: testUser.email });
    });

    afterAll(async () => {
        // Clean up
        await mAuth.deleteOne({ email: testUser.email });
        await db.disconnect();
    });

    test('POST /auth/register should create a new user', async () => {
        const response = await app.handle(
            new Request('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testUser)
            })
        );
        const data: any = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user).toBeDefined();
        expect(data.user.email).toBe(testUser.email);
        expect(data.user.role).toBe('user');
        // Password should not be returned
        expect(data.user.password).toBeUndefined();
    });

    test('POST /auth/login should authenticate user and return token', async () => {
        const response = await app.handle(
            new Request('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testUser.email,
                    password: testUser.password
                })
            })
        );
        const data: any = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.token).toBeDefined();
        expect(data.user).toBeDefined();
        expect(data.user.email).toBe(testUser.email);
    });

    test('POST /auth/login with wrong password should fail', async () => {
        const response = await app.handle(
            new Request('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testUser.email,
                    password: 'wrongpassword'
                })
            })
        );
        const data: any = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
    });

    // Test the root /auth route
    test('GET /auth should return 200 and info', async () => {
        const response = await app.handle(
            new Request('http://localhost:3000/auth')
        );
        const data: any = await response.json();
        expect(response.status).toBe(200);
        expect(data.message).toBe('Auth Service Ready');
    });
});
