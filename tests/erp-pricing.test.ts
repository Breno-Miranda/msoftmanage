import { afterEach, describe, expect, test } from 'bun:test';
import { mErp } from '../src/models/mErp';
import { calcularPrecificacao } from '../src/services/erpPricing';

const originalFind = mErp.find;
const originalFindOne = mErp.findOne;

afterEach(() => {
    mErp.find = originalFind;
    mErp.findOne = originalFindOne;
});

describe('calcularPrecificacao', () => {
    test('loads all material inputs with one batched query', async () => {
        let findCalls = 0;
        mErp.find = ((filter: any) => {
            findCalls++;
            expect(filter).toEqual({
                uuid: { $in: ['filamento-a', 'embalagem-a', 'acessorio-a'] },
                appKey: 'bva',
                tipo: 'insumo',
                deletedAt: null,
            });
            return Promise.resolve([
                { uuid: 'filamento-a', data: { nome: 'PLA', custoPorUnidade: 0.1 } },
                { uuid: 'embalagem-a', data: { nome: 'Caixa', custoPorUnidade: 2 } },
                { uuid: 'acessorio-a', data: { nome: 'Olhos', custoPorUnidade: 1.5 } },
            ]);
        }) as any;
        mErp.findOne = (() => {
            throw new Error('N+1 query regression');
        }) as any;

        const result = await calcularPrecificacao('bva', {
            nome: 'Produto',
            categoria: 'Sensorial',
            pesoGramas: 10,
            tempoHoras: 2,
            insumoId: 'filamento-a',
            embalagemId: 'embalagem-a',
            acessoriosIds: ['acessorio-a'],
            custoMaquinaHora: 3,
            margemAtacado: 20,
            margemVarejo: 50,
            estoqueAcabado: 1,
        });

        expect(findCalls).toBe(1);
        expect(result.custoMateriais).toBe(4.5);
        expect(result.custoTotal).toBe(10.5);
        expect(result.precoAtacado).toBe(12.6);
        expect(result.precoVarejo).toBe(15.75);
    });
});
