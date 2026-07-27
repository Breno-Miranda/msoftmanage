import { Elysia } from 'elysia';
import { requireActiveUser } from '../../middleware/requireAuth';
import { mAppAccess } from '../../models/mAppAccess';
import { MongooseOrganizationContextRepository } from './organizationContext.repository';
import {
    OrganizationContextError,
    type OrganizationContextRepository,
    type OrganizationContextUser,
    resolveOrganizationContext,
} from './organizationContext';

const ERP_FINANCE_APP_KEY = 'controlador-erp';

export interface ErpFinanceRouteDependencies {
    authenticate?: (ctx: any) => Promise<OrganizationContextUser | undefined>;
    hasAppAccess?: (input: { userId: string; appKey: string; }) => Promise<boolean>;
    repository?: OrganizationContextRepository;
}

function readHeader(ctx: any, name: string): string | undefined {
    const fromObject = ctx.headers?.[name] ?? ctx.headers?.[name.toLowerCase()] ?? ctx.headers?.[name.toUpperCase()];
    if (typeof fromObject === 'string' && fromObject.trim()) return fromObject.trim();

    const fromRequest = ctx.request?.headers?.get?.(name);
    if (typeof fromRequest === 'string' && fromRequest.trim()) return fromRequest.trim();

    return undefined;
}

async function defaultHasAppAccess(input: { userId: string; appKey: string; }): Promise<boolean> {
    const access = await mAppAccess.findOne({ userId: input.userId, appKey: input.appKey }).select('_id').lean();
    return Boolean(access);
}

export function createErpFinanceRoutes(dependencies: ErpFinanceRouteDependencies = {}) {
    const authenticate = dependencies.authenticate ?? requireActiveUser;
    const hasAppAccess = dependencies.hasAppAccess ?? defaultHasAppAccess;
    const repository = dependencies.repository ?? new MongooseOrganizationContextRepository();

    return new Elysia({ prefix: '/erp-finance' })
        .get('/context', async (ctx: any) => {
            const user = await authenticate(ctx);
            if (!user) {
                return { success: false, error: 'Não autorizado' };
            }

            const hasEntitlement = await hasAppAccess({ userId: user.sub, appKey: ERP_FINANCE_APP_KEY });
            if (!hasEntitlement) {
                ctx.set.status = 403;
                return { success: false, error: 'Sem acesso ao controlador ERP' };
            }

            try {
                return await resolveOrganizationContext({
                    user,
                    organizationId: readHeader(ctx, 'x-organization-id'),
                    unitId: readHeader(ctx, 'x-organization-unit-id'),
                    repository,
                });
            } catch (error) {
                if (error instanceof OrganizationContextError) {
                    ctx.set.status = error.status;
                    return { success: false, error: error.message, code: error.code };
                }

                throw error;
            }
        });
}

export const erpFinanceRoutes = createErpFinanceRoutes();
