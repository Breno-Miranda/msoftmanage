import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurantTable extends Document {
    uuid: string;
    appKey: string;
    number: string;
    capacity: number;
    status: 'free' | 'occupied' | 'reserved' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

const restaurantTableSchema = new Schema<IRestaurantTable>(
    {
        uuid: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
        },
        appKey: { type: String, required: true, index: true },
        number: { type: String, required: true },
        capacity: { type: Number, default: 4 },
        status: {
            type: String,
            enum: ['free', 'occupied', 'reserved', 'inactive'],
            default: 'free',
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform: (_, ret) => {
                delete ret._id;
                return ret;
            },
        },
    }
);

restaurantTableSchema.index({ appKey: 1, status: 1 });
restaurantTableSchema.index({ appKey: 1, number: 1 }, { unique: true });

export const mRestaurantTable = mongoose.model<IRestaurantTable>(
    'mRestaurantTable',
    restaurantTableSchema
);
