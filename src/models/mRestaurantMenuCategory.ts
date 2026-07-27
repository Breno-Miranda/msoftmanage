import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurantMenuCategory extends Document {
    uuid: string;
    appKey: string;
    name: string;
    sortOrder: number;
    status: 'active' | 'inactive' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

const restaurantMenuCategorySchema = new Schema<IRestaurantMenuCategory>(
    {
        uuid: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
        },
        appKey: { type: String, required: true, index: true },
        name: { type: String, required: true },
        sortOrder: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['active', 'inactive', 'archived'],
            default: 'active',
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

restaurantMenuCategorySchema.index({ appKey: 1, status: 1 });

export const mRestaurantMenuCategory = mongoose.model<IRestaurantMenuCategory>(
    'mRestaurantMenuCategory',
    restaurantMenuCategorySchema
);
