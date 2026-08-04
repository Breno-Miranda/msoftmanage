import { Schema, model, type Document } from 'mongoose';

export interface IClientForm extends Document {
    eventId: string;
    source: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    consentVersion: string;
    occurredAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const clientFormSchema = new Schema<IClientForm>({
    eventId: { type: String, required: true, unique: true, index: true },
    source: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    consentVersion: { type: String, required: true },
    occurredAt: { type: Date, required: true },
}, { timestamps: true, versionKey: false, collection: 'client_forms' });

export const ClientForm = model<IClientForm>('ClientForm', clientFormSchema);
