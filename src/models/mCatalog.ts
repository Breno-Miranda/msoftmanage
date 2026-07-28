import mongoose, { Document, Schema } from 'mongoose';

export interface ICatalog extends Document {
    name: string;
    appKey: string;
    description: string;
    price: number;
    currency: string;
    type: 'free' | 'subscription' | 'one-time';
    icon: string;
    category?: string;
    features?: string[];
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const catalogSchema = new Schema(
    {
        name: { type: String, required: true },
        appKey: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        price: { type: Number, default: 0 },
        currency: { type: String, default: 'BRL' },
        type: { type: String, enum: ['free', 'subscription', 'one-time'], default: 'free' },
        icon: { type: String, default: 'bi-box' },
        category: { type: String },
        features: { type: [String], default: [] },
        // Soft-delete: itens antigos (sem o campo gravado) continuam ativos
        // porque as queries publicas filtram com { active: { $ne: false } }.
        active: { type: Boolean, default: true }
    },
    {
        timestamps: true,
    }
);

export const mCatalog = mongoose.model<ICatalog>('mCatalog', catalogSchema);
