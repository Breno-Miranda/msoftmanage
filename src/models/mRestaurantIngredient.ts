import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurantIngredient extends Document {
    uuid: string;
    appKey: string;
    name: string;
    unit: 'unidade' | 'kg' | 'g' | 'ml' | 'l';
    stock: number;
    minStock: number;
    cost?: number;
    status: 'active' | 'inactive' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

const restaurantIngredientSchema = new Schema<IRestaurantIngredient>(
    {
        uuid: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
        },
        appKey: { type: String, required: true, index: true },
        name: { type: String, required: true },
        unit: {
            type: String,
            enum: ['unidade', 'kg', 'g', 'ml', 'l'],
            default: 'unidade',
        },
        stock: { type: Number, required: true, default: 0 },
        minStock: { type: Number, required: true, default: 0 },
        cost: { type: Number },
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

restaurantIngredientSchema.index({ appKey: 1, status: 1 });
restaurantIngredientSchema.index({ appKey: 1, name: 1 });

export const mRestaurantIngredient = mongoose.model<IRestaurantIngredient>(
    'mRestaurantIngredient',
    restaurantIngredientSchema
);
