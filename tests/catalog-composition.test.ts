import { afterEach, describe, expect, test } from 'bun:test';
import { app } from '../src/app';
import { mCatalog } from '../src/models/mCatalog';

const originalFind = mCatalog.find;

afterEach(() => {
    mCatalog.find = originalFind;
});

describe('catalog route composition', () => {
    test('GET /catalog returns the catalog response from the reusable app without a database connection', async () => {
        const catalogItems = [{
            name: 'Gerador de Senha',
            appKey: 'password-gen',
            type: 'free',
            price: 0,
            icon: 'bi-key',
            description: 'Crie senhas fortes e seguras.',
        }];
        mCatalog.find = (() => ({
            sort: () => Promise.resolve(catalogItems),
        })) as any;

        const response = await app.handle(new Request('http://localhost/catalog'));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ success: true, data: catalogItems });
    });
});
