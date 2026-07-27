export function buildActiveMembershipFilter(userId: string, organizationId: string) {
    return {
        userId,
        organizationId,
        active: true,
    };
}
