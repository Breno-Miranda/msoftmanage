import { Elysia } from 'elysia';
import { requireActiveUser } from '../../middleware/requireAuth';
import { mAppAccess } from '../../models/mAppAccess';
import { mCrmCustomer } from '../../models/mCrmCustomer';
import {
    MongooseOrganizationContextRepository,
} from '../erpFinance/organizationContext.repository';
import {
    OrganizationContextError,
    type OrganizationContextRepository,
    type OrganizationContextUser,
    resolveOrganizationContext,
} from '../erpFinance/organizationContext';

const CRM_APP_KEY = 'crm-enterprise';

export interface CrmCustomerRepository {
    listActiveByOrganization(organizationId: string): Promise<unknown[]>;
    create(input: unknown): Promise<unknown>;
}

export interface CrmRouteDependencies {
    authenticate?: (ctx: any) => Promise<OrganizationContextUser | undefined>;
    hasAppAccess?: (input: { userId: string; appKey: string; }) => Promise<boolean>;
    organizationRepository?: OrganizationContextRepository;
    customerRepository?: CrmCustomerRepository;
}

function readHeader(ctx: any, name: string): string | undefined {
    const value = ctx.request?.headers?.get?.(name) ?? ctx.headers?.[name] ?? ctx.headers?.[name.toLowerCase()];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function defaultHasAppAccess(input: { userId: string; appKey: string; }): Promise<boolean> {
    const access = await mAppAccess.findOne({ userId: input.userId, appKey: input.appKey }).select('_id').lean();
    return Boolean(access);
}

export function createCrmRoutes(dependencies: CrmRouteDependencies = {}) {
    const authenticate = dependencies.authenticate ?? requireActiveUser;
    const hasAppAccess = dependencies.hasAppAccess ?? defaultHasAppAccess;
    const organizationRepository = dependencies.organizationRepository ?? new MongooseOrganizationContextRepository();
    const customerRepository = dependencies.customerRepository ?? {
        async listActiveByOrganization(organizationId: string) {
            return mCrmCustomer.find({ organizationId, status: 'active' }).sort({ createdAt: -1 }).lean();
        },
        async create(input: any) { return mCrmCustomer.create(input); },
    };

    async function resolveAuthorizedContext(ctx: any) {
        const user = await authenticate(ctx);
        if (!user) {
            ctx.set.status = 401;
            return null;
        }

        if (!await hasAppAccess({ userId: user.sub, appKey: CRM_APP_KEY })) {
            ctx.set.status = 403;
            return null;
        }

        return resolveOrganizationContext({
            user,
            organizationId: readHeader(ctx, 'x-organization-id'),
            unitId: readHeader(ctx, 'x-organization-unit-id'),
            repository: organizationRepository,
        });
    }

    function contextError(ctx: any, error: unknown) {
        if (error instanceof OrganizationContextError) {
            ctx.set.status = error.status;
            return { success: false, error: error.message, code: error.code };
        }
        throw error;
    }

    return new Elysia({ prefix: '/crm' })
        .get('/context', async (ctx: any) => {
            try {
                const context = await resolveAuthorizedContext(ctx);
                if (!context) return { success: false, error: ctx.set.status === 403 ? 'Sem acesso ao CRM' : 'Não autorizado' };
                return { success: true, data: context };
            } catch (error) {
                return contextError(ctx, error);
            }
        })
        .get('/customers', async (ctx: any) => {
            try {
                const context = await resolveAuthorizedContext(ctx);
                if (!context) return { success: false, error: ctx.set.status === 403 ? 'Sem acesso ao CRM' : 'Não autorizado' };
                const data = await customerRepository.listActiveByOrganization(context.organizationId);
                return { success: true, data };
            } catch (error) {
                return contextError(ctx, error);
            }
        })
        .post('/customers', async (ctx: any) => {
            try {
                const context = await resolveAuthorizedContext(ctx);
                if (!context) return { success: false, error: ctx.set.status === 403 ? 'Sem acesso ao CRM' : 'Não autorizado' };
                const body = ctx.body ?? {};
                const name = typeof body.name === 'string' ? body.name.trim() : '';
                const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
                if (!name || (body.email !== undefined && !email)) { ctx.set.status = 400; return { success: false, error: 'Nome e e-mail válido são obrigatórios' }; }
                const input = { organizationId: context.organizationId, name, ...(email ? { email } : {}), ...(typeof body.phone === 'string' && body.phone.trim() ? { phone: body.phone.trim() } : {}), ...(typeof body.source === 'string' && body.source.trim() ? { source: body.source.trim() } : {}), status: 'active' as const };
                const data = await customerRepository.create(input);
                ctx.set.status = 201;
                return { success: true, data };
            } catch (error: any) {
                if (error?.code === 11000) { ctx.set.status = 409; return { success: false, error: 'E-mail já cadastrado nesta organização' }; }
                return contextError(ctx, error);
            }
        });
}

export const crmRoutes = createCrmRoutes();
