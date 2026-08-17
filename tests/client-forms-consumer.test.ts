import { expect, test } from 'bun:test';
import { persistClientFormEvent } from '../src/modules/clientForms/consumer';

test('persiste uma única vez o evento válido de formulário público por eventId', async () => {
    const calls: unknown[][] = [];
    const repository = {
        updateOne: async (...args: unknown[]) => {
            calls.push(args);
            return { acknowledged: true, upsertedCount: 1 };
        },
    };
    const event = {
        eventId: '4ea8ec3e-bf02-4a96-b388-a0cac09e60de',
        eventType: 'client.form.submitted',
        eventVersion: 1,
        occurredAt: '2026-08-04T00:00:00.000Z',
        source: 'padrao-engenharia',
        lead: { name: 'Ana Silva', email: 'ana@example.com', phone: '11999999999', message: 'Quero uma proposta comercial.' },
        consent: { granted: true, textVersion: 'public-client-form-v1' },
    };

    await persistClientFormEvent(event, repository);

    expect(calls).toEqual([[{ eventId: event.eventId }, {
        $setOnInsert: expect.objectContaining({
            eventId: event.eventId,
            source: 'padrao-engenharia',
            email: 'ana@example.com',
        }),
    }, { upsert: true }]]);
});

test('persiste evento de formulário público sem e-mail', async () => {
    const calls: any[][] = [];
    const repository = {
        updateOne: async (...args: any[]) => {
            calls.push(args);
            return { acknowledged: true, upsertedCount: 1 };
        },
    };
    const event = {
        eventId: '5ea8ec3e-bf02-4a96-b388-a0cac09e60de',
        eventType: 'client.form.submitted',
        eventVersion: 1,
        occurredAt: '2026-08-04T00:00:00.000Z',
        source: 'padrao-engenharia',
        lead: { name: 'Ana Silva', phone: '11999999999', message: 'Quero uma proposta comercial.' },
        consent: { granted: true, textVersion: 'public-client-form-v1' },
    };

    await persistClientFormEvent(event, repository);

    expect(calls[0][1].$setOnInsert).toEqual(expect.objectContaining({
        eventId: event.eventId,
        name: 'Ana Silva',
        phone: '11999999999',
    }));
    expect(calls[0][1].$setOnInsert).not.toHaveProperty('email');
});

test('rejeita evento de formulário inválido antes de persistir', async () => {
    let called = false;
    await expect(persistClientFormEvent({ eventId: 'invalid' }, {
        updateOne: async () => { called = true; },
    })).rejects.toThrow('Evento client.form.submitted inválido');
    expect(called).toBe(false);
});
