import { Schema, model, Document } from 'mongoose';

export interface ICrmCustomer extends Document {
    uuid: string;
    organizationId: string;
    name: string;
    email?: string;
    phone?: string;
    source?: string;
    status: 'active' | 'archived';
}

const crmCustomerSchema = new Schema<ICrmCustomer>({
    uuid: { type: String, default: () => crypto.randomUUID(), immutable: true, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, immutable: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    source: { type: String, trim: true },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
}, { timestamps: true, versionKey: false, collection: 'crm_customers' });

crmCustomerSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
crmCustomerSchema.index({ organizationId: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });

export const mCrmCustomer = model<ICrmCustomer>('mCrmCustomer', crmCustomerSchema);
