import { Schema, model, Document } from 'mongoose';

/**
 * Interface for mAuth (User/Authentication)
 */
export interface IMAuth extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'user' | 'premium';
    status: 'active' | 'inactive';
    provider?: string; // 'local', 'google', etc.
    avatar?: string;
    lastLogin?: Date;
    [key: string]: any;
}

/**
 * Mongoose Schema for mAuth
 */
const mAuthSchema = new Schema<IMAuth>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, index: true },
        password: { type: String, select: false }, // Don't return password by default
        role: {
            type: String,
            enum: ['admin', 'user', 'premium'],
            default: 'user'
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        },
        provider: { type: String, default: 'local' },
        avatar: { type: String },
        lastLogin: { type: Date }
    },
    {
        strict: false,
        timestamps: true,
        versionKey: false,
        collection: 'mauth',
        toJSON: {
            transform: function (_doc, ret: any) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.password;
                return ret;
            },
        },
    }
);

// Hash password before saving (placeholder logic, actual hashing usually in controller or pre-save hook)
// For now, simpler implementation.

export const mAuth = model<IMAuth>('mAuth', mAuthSchema);
