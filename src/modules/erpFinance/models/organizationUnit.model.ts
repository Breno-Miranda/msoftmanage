import { Schema, model, Document } from 'mongoose';

export interface IOrganizationUnit extends Document {
    uuid: string;
    organizationId: string;
    name: string;
    active: boolean;
}

const organizationUnitSchema = new Schema<IOrganizationUnit>(
    {
        uuid: {
            type: String,
            default: () => crypto.randomUUID(),
            immutable: true,
            required: true,
            unique: true,
            index: true,
        },
        organizationId: {
            type: String,
            required: true,
            immutable: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        active: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'erp_finance_organization_units',
    }
);

organizationUnitSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const mOrganizationUnit = model<IOrganizationUnit>('mOrganizationUnit', organizationUnitSchema);
