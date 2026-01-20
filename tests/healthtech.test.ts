import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { app } from '../src/app';
import { db } from '../src/config/database';

import { Patient } from '../src/models/healthtech/Patient';
import { Formula } from '../src/models/healthtech/Formula';

const BASE_URL = 'http://localhost:3000/healthtech';

describe('HealthTech Module', () => {
    let patientId: string = '';

    beforeAll(async () => {
        // Connect to DB before tests
        await db.connect();
        // Clear collections
        await Patient.deleteMany({});
        await Formula.deleteMany({});
    });

    afterAll(async () => {
        // Disconnect after tests
        // await db.disconnect(); // Keep it open if needed or close it properly. 
        // Elysia/Mongoose might complain if we close it while pending requests exist.
        // For safe shutdown:
        await db.disconnect();
    });

    it('should create a new patient', async () => {
        const res = await app.handle(new Request(`${BASE_URL}/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Patient',
                cpf: '123.456.789-00',
                lgpdConsent: true,
                contact: { email: 'test@example.com' }
            })
        }));

        const response: any = await res.json();
        expect(res.status).toBe(200);
        expect(response.success).toBe(true);
        expect(response.data.name).toBe('Test Patient');
        patientId = response.data._id;
    });

    it('should get the created patient', async () => {
        const res = await app.handle(new Request(`${BASE_URL}/patients/${patientId}`));
        const response: any = await res.json();

        expect(res.status).toBe(200);
        expect(response._id).toBe(patientId);
    });

    it('should create a formula for the patient', async () => {
        const res = await app.handle(new Request(`${BASE_URL}/formulas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Custom Cream',
                form: 'cream',
                patientId: patientId,
                ingredients: [
                    { name: 'Urea', concentration: '10', unit: '%' }
                ]
            })
        }));

        const response: any = await res.json();
        expect(res.status).toBe(200);
        expect(response.success).toBe(true);
        expect(response.data.name).toBe('Custom Cream');
    });
});
