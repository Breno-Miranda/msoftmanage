import mongoose, { Document, Schema } from 'mongoose';

export interface IApps extends Document {
    name: string;
    appKey: string;
    userId: mongoose.Types.ObjectId;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const appsSchema = new Schema(
    {
        name: { type: String, required: true },
        appKey: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
        status: { type: String, default: 'active', enum: ['active', 'inactive', 'pending'] },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate installation of same app for same user
appsSchema.index({ userId: 1, appKey: 1 }, { unique: true });

export const mApps = mongoose.model<IApps>('mApps', appsSchema);
