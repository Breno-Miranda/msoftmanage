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
        features: { type: [String], default: [] }
    },
    {
        timestamps: true,
    }
);

export const mCatalog = mongoose.model<ICatalog>('mCatalog', catalogSchema);
