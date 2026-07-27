export interface OrganizationContextUser {
    sub: string;
}

export interface OrganizationMembershipScope {
    organizationId: string;
    active: boolean;
    allUnits: boolean;
    unitIds: string[];
}

export interface OrganizationUnitScope {
    unitId: string;
    organizationId: string;
    active: boolean;
}

export interface OrganizationContextRepository {
    findActiveMembership(input: {
        userId: string;
        organizationId: string;
    }): Promise<OrganizationMembershipScope | null>;
    findUnitById(unitId: string): Promise<OrganizationUnitScope | null>;
}

export interface ResolveOrganizationContextInput {
    user: OrganizationContextUser;
    organizationId?: string | null;
    unitId?: string | null;
    repository: OrganizationContextRepository;
}

export type ResolvedOrganizationContext = Readonly<{
    organizationId: string;
    unitId?: string;
}>;

export class OrganizationContextError extends Error {
    constructor(
        public readonly code: 'organization_required' | 'organization_forbidden' | 'unit_required' | 'unit_cross_organization' | 'unit_forbidden',
        public readonly status: 400 | 403,
        message: string,
    ) {
        super(message);
    }
}

function freezeContext(organizationId: string, unitId?: string): ResolvedOrganizationContext {
    if (unitId) return Object.freeze({ organizationId, unitId });
    return Object.freeze({ organizationId });
}

export async function resolveOrganizationContext(input: ResolveOrganizationContextInput): Promise<ResolvedOrganizationContext> {
    const organizationId = input.organizationId?.trim();
    const unitId = input.unitId?.trim();

    if (!organizationId) {
        throw new OrganizationContextError('organization_required', 400, 'x-organization-id é obrigatório');
    }

    const membership = await input.repository.findActiveMembership({
        userId: input.user.sub,
        organizationId,
    });

    if (!membership || !membership.active) {
        throw new OrganizationContextError('organization_forbidden', 403, 'Organização não autorizada');
    }

    if (!unitId) {
        if (!membership.allUnits) {
            throw new OrganizationContextError('unit_required', 403, 'x-organization-unit-id é obrigatório para este associado');
        }

        return freezeContext(organizationId);
    }

    const unit = await input.repository.findUnitById(unitId);
    if (!unit || unit.organizationId !== organizationId) {
        throw new OrganizationContextError('unit_cross_organization', 403, 'Unidade não pertence à organização selecionada');
    }

    const hasUnitScope = membership.allUnits || membership.unitIds.includes(unitId);
    if (!hasUnitScope) {
        throw new OrganizationContextError('unit_forbidden', 403, 'Unidade não autorizada para o associado');
    }

    return freezeContext(organizationId, unitId);
}
