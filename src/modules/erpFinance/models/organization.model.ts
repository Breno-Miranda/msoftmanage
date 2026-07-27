import { Schema, model, Document } from 'mongoose';

export interface IOrganization extends Document {
    uuid: string;
    name: string;
    active: boolean;
}

const organizationSchema = new Schema<IOrganization>(
    {
        uuid: {
            type: String,
            default: () => crypto.randomUUID(),
            immutable: true,
            required: true,
            unique: true,
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
        collection: 'erp_finance_organizations',
    }
);

organizationSchema.index({ name: 1 }, { unique: true });

export const mOrganization = model<IOrganization>('mOrganization', organizationSchema);
