import { Schema, model, Document, Types } from 'mongoose';

export interface IOrganizationMembership extends Document {
    uuid: string;
    userId: Types.ObjectId;
    organizationId: string;
    active: boolean;
    allUnits: boolean;
    unitIds: string[];
}

const organizationMembershipSchema = new Schema<IOrganizationMembership>(
    {
        uuid: {
            type: String,
            default: () => crypto.randomUUID(),
            immutable: true,
            required: true,
            unique: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'mAuth',
            required: true,
            immutable: true,
            index: true,
        },
        organizationId: {
            type: String,
            required: true,
            immutable: true,
            index: true,
        },
        active: {
            type: Boolean,
            default: true,
            index: true,
        },
        allUnits: {
            type: Boolean,
            default: false,
        },
        unitIds: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'erp_finance_organization_memberships',
    }
);

organizationMembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
organizationMembershipSchema.index({ organizationId: 1, active: 1 });

export const mOrganizationMembership = model<IOrganizationMembership>('mOrganizationMembership', organizationMembershipSchema);
