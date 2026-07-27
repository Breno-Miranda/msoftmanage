import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { createCrmRoutes } from '../src/modules/crm/crm.controller';
import { mCrmCustomer } from '../src/models/mCrmCustomer';

function createApp(options: any = {}) {
    const created: any[] = [];
    const appKeys: string[] = [];
    const contextLookups = { memberships: 0, units: 0 };
    const app = new Elysia().use(createCrmRoutes({
        authenticate: async () => options.user === null ? undefined : { sub: 'user-1' },
        hasAppAccess: async ({ appKey }: any) => { appKeys.push(appKey); return options.entitlement !== false; },
        organizationRepository: {
            async findActiveMembership() { contextLookups.memberships += 1; return options.membership === undefined ? { organizationId: 'org-1', active: true, allUnits: true, unitIds: [] } : options.membership; },
            async findUnitById(unitId: string) { contextLookups.units += 1; return options.unit ?? { unitId, organizationId: 'org-1', active: true }; },
        },
        customerRepository: {
            async listActiveByOrganization(organizationId: string) { return (options.customers ?? []).filter((item: any) => item.organizationId === organizationId && item.status === 'active'); },
            async create(input: any) { if (options.duplicate) throw { code: 11000 }; created.push(input); return { uuid: 'customer-1', ...input }; },
        },
    }));
    return { app, created, appKeys, contextLookups };
}

const headers = { 'Content-Type': 'application/json', 'X-Organization-Id': 'org-1' };

describe('CRM multitenant routes', () => {
    test('rejects an anonymous request before resolving tenant data', async () => {
        const fixture = createApp({ user: null });
        const response = await fixture.app.handle(new Request('http://localhost/crm/context', { headers }));
        expect(response.status).toBe(401);
        expect(fixture.contextLookups).toEqual({ memberships: 0, units: 0 });
    });

    test('uses only the fixed crm-enterprise entitlement and returns the resolved context', async () => {
        const { app, appKeys } = createApp();
        const response = await app.handle(new Request('http://localhost/crm/context?appKey=forjado', { headers }));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ success: true, data: { organizationId: 'org-1' } });
        expect(appKeys).toEqual(['crm-enterprise']);
    });

    test('rejects missing entitlement, inactive membership, missing organization and cross-organization unit', async () => {
        const cases = [
            [createApp({ entitlement: false }), new Request('http://localhost/crm/context', { headers }), 403],
            [createApp({ membership: { organizationId: 'org-1', active: false, allUnits: true, unitIds: [] } }), new Request('http://localhost/crm/context', { headers }), 403],
            [createApp(), new Request('http://localhost/crm/context'), 400],
            [createApp({ unit: { unitId: 'unit-2', organizationId: 'org-2', active: true } }), new Request('http://localhost/crm/context', { headers: { ...headers, 'X-Organization-Unit-Id': 'unit-2' } }), 403],
        ] as const;
        for (const [fixture, request, status] of cases) expect((await fixture.app.handle(request)).status).toBe(status);
    });

    test('denies missing memberships, omitted units for restricted members and units outside membership scope', async () => {
        const cases = [
            [createApp({ membership: null }), new Request('http://localhost/crm/context', { headers })],
            [createApp({ membership: { organizationId: 'org-1', active: true, allUnits: false, unitIds: ['unit-1'] } }), new Request('http://localhost/crm/context', { headers })],
            [createApp({ membership: { organizationId: 'org-1', active: true, allUnits: false, unitIds: ['unit-1'] }, unit: { unitId: 'unit-2', organizationId: 'org-1', active: true } }), new Request('http://localhost/crm/context', { headers: { ...headers, 'X-Organization-Unit-Id': 'unit-2' } })],
        ] as const;
        for (const [fixture, request] of cases) expect((await fixture.app.handle(request)).status).toBe(403);
    });

    test('denies missing entitlement before tenant lookups', async () => {
        const fixture = createApp({ entitlement: false });
        expect((await fixture.app.handle(new Request('http://localhost/crm/context', { headers }))).status).toBe(403);
        expect(fixture.contextLookups).toEqual({ memberships: 0, units: 0 });
    });

    test('lists active customers only in the resolved organization', async () => {
        const { app } = createApp({ customers: [{ uuid: 'one', organizationId: 'org-1', status: 'active' }, { uuid: 'two', organizationId: 'org-2', status: 'active' }, { uuid: 'three', organizationId: 'org-1', status: 'archived' }] });
        const response = await app.handle(new Request('http://localhost/crm/customers', { headers }));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ success: true, data: [{ uuid: 'one', organizationId: 'org-1', status: 'active' }] });
    });

    test('creates with only the resolved organization and rejects duplicate email locally', async () => {
        const fixture = createApp();
        const response = await fixture.app.handle(new Request('http://localhost/crm/customers', { method: 'POST', headers, body: JSON.stringify({ name: 'Cliente', email: 'CLIENTE@EXAMPLE.COM', phone: '1', source: 'manual', organizationId: 'org-forjada', appKey: 'forjado', status: 'archived' }) }));
        expect(response.status).toBe(201);
        expect(fixture.created).toEqual([{ organizationId: 'org-1', name: 'Cliente', email: 'cliente@example.com', phone: '1', source: 'manual', status: 'active' }]);
        const duplicate = createApp({ duplicate: true });
        expect((await duplicate.app.handle(new Request('http://localhost/crm/customers', { method: 'POST', headers, body: JSON.stringify({ name: 'Cliente', email: 'cliente@example.com' }) }))).status).toBe(409);
    });

    test('allows the same normalized email in different organizations', async () => {
        const first = createApp();
        const second = createApp({ membership: { organizationId: 'org-2', active: true, allUnits: true, unitIds: [] } });
        const body = JSON.stringify({ name: 'Cliente', email: 'cliente@example.com' });
        expect((await first.app.handle(new Request('http://localhost/crm/customers', { method: 'POST', headers, body }))).status).toBe(201);
        expect((await second.app.handle(new Request('http://localhost/crm/customers', { method: 'POST', headers: { ...headers, 'X-Organization-Id': 'org-2' }, body }))).status).toBe(201);
        expect(first.created[0].organizationId).toBe('org-1');
        expect(second.created[0].organizationId).toBe('org-2');
    });

    test('defines a supported partial unique email index per organization', () => {
        const indexes = mCrmCustomer.schema.indexes();
        expect(indexes).toContainEqual([{ organizationId: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } }, background: true }]);
    });
});
