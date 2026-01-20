import { Schema, model, Document } from 'mongoose';

export interface IMLog extends Document {
    action: string; // e.g., 'LOGIN', 'CREATE_USER', 'UPDATE_BLOG'
    details: string; // Description of what happened
    user?: string; // User email or ID
    level: 'info' | 'warning' | 'error';
    createdAt: Date;
}

const mLogSchema = new Schema<IMLog>(
    {
        action: { type: String, required: true },
        details: { type: String, required: true },
        user: { type: String },
        level: { type: String, enum: ['info', 'warning', 'error'], default: 'info' }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'mlogs'
    }
);

export const mLogs = model<IMLog>('mLogs', mLogSchema);
