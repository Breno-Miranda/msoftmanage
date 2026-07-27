import { mOrganizationMembership } from './models/organizationMembership.model';
import { mOrganizationUnit } from './models/organizationUnit.model';
import type { OrganizationContextRepository, OrganizationMembershipScope, OrganizationUnitScope } from './organizationContext';
import { buildActiveMembershipFilter } from './organizationContext.filters';

export { buildActiveMembershipFilter } from './organizationContext.filters';

export class MongooseOrganizationContextRepository implements OrganizationContextRepository {
    async findActiveMembership(input: { userId: string; organizationId: string; }): Promise<OrganizationMembershipScope | null> {
        const membership = await mOrganizationMembership
            .findOne(buildActiveMembershipFilter(input.userId, input.organizationId))
            .lean();

        if (!membership) return null;

        return {
            organizationId: membership.organizationId,
            active: membership.active,
            allUnits: membership.allUnits,
            unitIds: Array.isArray(membership.unitIds) ? membership.unitIds : [],
        };
    }

    async findUnitById(unitId: string): Promise<OrganizationUnitScope | null> {
        const unit = await mOrganizationUnit.findOne({ uuid: unitId, active: true }).lean();
        if (!unit) return null;

        return {
            unitId: unit.uuid,
            organizationId: unit.organizationId,
            active: unit.active,
        };
    }
}
