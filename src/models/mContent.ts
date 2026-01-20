import { Schema, model, Document } from 'mongoose';

export interface IMContent extends Document {
    key: string;
    data: any;
    updatedAt: Date;
}

const mContentSchema = new Schema<IMContent>(
    {
        key: { type: String, required: true, unique: true, index: true },
        data: { type: Object, required: true }
    },
    {
        timestamps: true,
        collection: 'mcontent'
    }
);

export const mContent = model<IMContent>('mContent', mContentSchema);
