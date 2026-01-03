import { Schema, model, Document } from 'mongoose';

/**
 * Interface for mCredential
 * Flexible schema as specific fields were not provided
 */
export interface IHCredential extends Document {
    [key: string]: any;
}

/**
 * Mongoose Schema for mCredential
 */
const mCredentialSchema = new Schema<IHCredential>(
    {
        // Flexible schema allowing any fields
    },
    {
        strict: false, // Allows saving fields not defined in schema
        timestamps: true,
        versionKey: false,
        collection: 'mcredential',
        toJSON: {
            transform: function (_doc, ret: any) {
                ret.id = ret._id;
                delete ret._id;
                return ret;
            },
        },
    }
);

export const mCredential = model<IHCredential>('mCredential', mCredentialSchema);
