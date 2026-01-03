import { Schema, model, Document } from 'mongoose';

/**
 * Interface for mTask
 * Flexible schema as specific fields were not provided
 */
export interface IHTask extends Document {
    [key: string]: any;
}

/**
 * Mongoose Schema for mTask
 */
const mTaskSchema = new Schema<IHTask>(
    {
        // Flexible schema
    },
    {
        strict: false,
        timestamps: true,
        versionKey: false,
        collection: 'mtask',
        toJSON: {
            transform: function (_doc, ret: any) {
                ret.id = ret._id;
                delete ret._id;
                return ret;
            },
        },
    }
);

export const mTask = model<IHTask>('mTask', mTaskSchema);
