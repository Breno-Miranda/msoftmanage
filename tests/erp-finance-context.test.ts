import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { buildActiveMembershipFilter } from '../src/modules/erpFinance/organizationContext.filters';
import { OrganizationContextRepository, resolveOrganizationContext } from '../src/modules/erpFinance/organizationContext';
import { createErpFinanceRoutes } from '../src/modules/erpFinance/erpFinance.controller';

function createRepository(overrides?: Partial<OrganizationContextRepository>): OrganizationContextRepository {
    return {
        async findActiveMembership() {
            return {
                organizationId: 'org-1',
                active: true,
                allUnits: false,
                unitIds: ['unit-1'],
            };
        },
        async findUnitById(unitId: string) {
            return {
                unitId,
                organizationId: 'org-1',
                active: true,
            };
        },
        ...overrides,
    };
}

describe('ERP finance organization context resolver', () => {
    test('resolves an authorized organization and unit', async () => {
        const context = await resolveOrganizationContext({
            user: { sub: 'user-1' },
            organizationId: 'org-1',
            unitId: 'unit-1',
            repository: createRepository(),
        });

        expect(context).toEqual({ organizationId: 'org-1', unitId: 'unit-1' });
        expect(Object.isFrozen(context)).toBe(true);
    });

    test('rejects a selection without organization', async () => {
        await expect(resolveOrganizationContext({
            user: { sub: 'user-1' },
            organizationId: undefined,
            unitId: 'unit-1',
            repository: createRepository(),
        })).rejects.toMatchObject({ code: 'organization_required', status: 400 });
    });

    test('rejects a missing membership', async () => {
        await expect(resolveOrganizationContext({
            user: { sub: 'user-1' },
            organizationId: 'org-1',
            repository: createRepository({
                async findActiveMembership() {
                    return null;
                },
            }),
        })).rejects.toMatchObject({ code: 'organization_forbidden', status: 403 });
    });

    test('rejects an inactive membership', async () => {
        await expect(resolveOrganizationContext({
            user: { sub: 'user-1' },
            organizationId: 'org-1',
            repository: createRepository({
                async findActiveMembership() {
                    return {
                        organizationId: 'org-1',
                        active: false,
                        allUnits: false,
                        unitIds: ['unit-1'],
                    };
                },
            }),
        })).rejects.toMatchObject({ code: 'organization_forbidden', status: 403 });
    });

    test('rejects a unit from another organization', async () => {
        await expect(resolveOrganizationContext({
            user: { sub: 'user-1' },
            organizationId: 'org-1',
            unitId: 'unit-2',
            repository: createRepository({
                async findUnitById(unitId: string) {
                    return {
                        unitId,
                        organizationId: 'org-2',
                        active: true,
                    };
                },
            }),
        })).rejects.toMatchObject({ code: 'unit_cross_organization', status: 403 });
    });

    test('rejects a unit outside the membership scope', async () => {
        await expect(resolveOrganizationContext({
            user: { sub: 'user-1' },
            organizationId: 'org-1',
            unitId: 'unit-2',
            repository: createRepository({
                async findUnitById(unitId: string) {
                    return {
                        unitId,
                        organizationId: 'org-1',
                        active: true,
                    };
                },
            }),
        })).rejects.toMatchObject({ code: 'unit_forbidden', status: 403 });
    });

    test('builds the membership filter with userId, organizationId and active=true', () => {
        expect(buildActiveMembershipFilter('user-1', 'org-1')).toEqual({
            userId: 'user-1',
            organizationId: 'org-1',
            active: true,
        });
    });

    test('rejects a unit-scoped membership without unit header', async () => {
        await expect(resolveOrganizationContext({
            user: { sub: 'user-1' },
            organizationId: 'org-1',
            repository: createRepository(),
        })).rejects.toMatchObject({ code: 'unit_required', status: 403 });
    });
});

describe('GET /erp-finance/context', () => {
    function createTestApp(options?: {
        user?: { sub: string } | null;
        membership?: Awaited<ReturnType<OrganizationContextRepository['findActiveMembership']>>;
        unit?: Awaited<ReturnType<OrganizationContextRepository['findUnitById']>>;
        entitlementAppKeys?: string[];
    }) {
        const observedAppKeys: string[] = [];
        const user = options?.user === undefined ? { sub: 'user-1' } : options.user;
        const membership = options?.membership === undefined
            ? {
                organizationId: 'org-1',
                active: true,
                allUnits: false,
                unitIds: ['unit-1'],
            }
            : options.membership;
        const unit = options?.unit === undefined
            ? {
                unitId: 'unit-1',
                organizationId: 'org-1',
                active: true,
            }
            : options.unit;
        const entitlementAppKeys = options?.entitlementAppKeys ?? ['controlador-erp'];

        const app = new Elysia().use(createErpFinanceRoutes({
            authenticate: async (ctx: any) => {
                if (!user) {
                    ctx.set.status = 401;
                    return undefined;
                }

                return user;
            },
            hasAppAccess: async ({ userId, appKey }) => {
                observedAppKeys.push(`${userId}:${appKey}`);
                return entitlementAppKeys.includes(appKey);
            },
            repository: {
                async findActiveMembership() {
                    return membership ?? null;
                },
                async findUnitById() {
                    return unit ?? null;
                },
            },
        }));

        return { app, observedAppKeys };
    }

    test('returns 400 when organization header is missing', async () => {
        const { app } = createTestApp();
        const response = await app.handle(new Request('http://localhost:3000/erp-finance/context', {
            headers: {
                'X-Organization-Unit-Id': 'unit-1',
            },
        }));

        expect(response.status).toBe(400);
    });

    test('returns 403 when the user lacks controlador-erp entitlement in mAppAccess', async () => {
        const { app } = createTestApp({ entitlementAppKeys: [] });
        const response = await app.handle(new Request('http://localhost:3000/erp-finance/context', {
            headers: {
                'X-Organization-Id': 'org-1',
                'X-Organization-Unit-Id': 'unit-1',
            },
        }));

        expect(response.status).toBe(403);
    });

    test('returns 200 for valid entitlement, active membership and authorized unit', async () => {
        const { app } = createTestApp({
            membership: {
                organizationId: 'org-1',
                active: true,
                allUnits: true,
                unitIds: [],
            },
        });
        const response = await app.handle(new Request('http://localhost:3000/erp-finance/context', {
            headers: {
                'X-Organization-Id': 'org-1',
                'X-Organization-Unit-Id': 'unit-1',
            },
        }));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ organizationId: 'org-1', unitId: 'unit-1' });
    });

    test('denies unit-scoped membership without unit header', async () => {
        const { app } = createTestApp();
        const response = await app.handle(new Request('http://localhost:3000/erp-finance/context', {
            headers: {
                'X-Organization-Id': 'org-1',
            },
        }));

        expect(response.status).toBe(403);
    });

    test('denies inactive unit', async () => {
        const { app } = createTestApp({ unit: null });
        const response = await app.handle(new Request('http://localhost:3000/erp-finance/context', {
            headers: {
                'X-Organization-Id': 'org-1',
                'X-Organization-Unit-Id': 'unit-1',
            },
        }));

        expect(response.status).toBe(403);
    });

    test('ignores query appKey when checking authorization', async () => {
        const { app, observedAppKeys } = createTestApp({
            entitlementAppKeys: ['controlador-erp'],
            membership: {
                organizationId: 'org-1',
                active: true,
                allUnits: true,
                unitIds: [],
            },
        });
        const response = await app.handle(new Request('http://localhost:3000/erp-finance/context?appKey=cliente-forjado', {
            headers: {
                'X-Organization-Id': 'org-1',
                'X-Organization-Unit-Id': 'unit-1',
            },
        }));

        expect(response.status).toBe(200);
        expect(observedAppKeys).toEqual(['user-1:controlador-erp']);
    });
});
