import { expect, test } from 'bun:test';

test('produção aceita a origem pública atual do portal Studio BVA', async () => {
    const sources = await Promise.all([
        Bun.file(new URL('../src/index.ts', import.meta.url)).text(),
        Bun.file(new URL('../src/app.ts', import.meta.url)).text(),
    ]);

    for (const source of sources) {
        expect(source).toContain("'https://studiobva.com.br'");
        expect(source).toContain("'https://studiobva.mirandasoft.com.br'");
    }
});