import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItemVariation {
    name: string;
    price: number;
    cost?: number;
}

export interface IMenuItemAddOn {
    name: string;
    price: number;
    cost?: number;
}

export interface IMenuItemRecipeItem {
    ingredientId: string;
    quantity: number;
}

export interface IRestaurantMenuItem extends Document {
    uuid: string;
    appKey: string;
    categoryId?: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    cost?: number;
    unit: 'unidade' | 'kg' | 'g' | 'ml';
    status: 'active' | 'inactive' | 'archived';
    variations: IMenuItemVariation[];
    addOns: IMenuItemAddOn[];
    recipe: IMenuItemRecipeItem[];
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const restaurantMenuItemSchema = new Schema<IRestaurantMenuItem>(
    {
        uuid: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
        },
        appKey: { type: String, required: true, index: true },
        categoryId: { type: String, index: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        description: { type: String },
        price: { type: Number, required: true, default: 0 },
        cost: { type: Number },
        unit: {
            type: String,
            enum: ['unidade', 'kg', 'g', 'ml'],
            default: 'unidade',
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'archived'],
            default: 'active',
        },
        variations: {
            type: [
                {
                    name: { type: String, required: true },
                    price: { type: Number, required: true, default: 0 },
                    cost: { type: Number },
                },
            ],
            default: [],
        },
        addOns: {
            type: [
                {
                    name: { type: String, required: true },
                    price: { type: Number, required: true, default: 0 },
                    cost: { type: Number },
                },
            ],
            default: [],
        },
        recipe: {
            type: [
                {
                    ingredientId: { type: String, required: true },
                    quantity: { type: Number, required: true, default: 0 },
                },
            ],
            default: [],
        },
        imageUrl: { type: String },
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

restaurantMenuItemSchema.index({ appKey: 1, slug: 1 }, { unique: true });
restaurantMenuItemSchema.index({ appKey: 1, categoryId: 1 });
restaurantMenuItemSchema.index({ appKey: 1, status: 1 });

export const mRestaurantMenuItem = mongoose.model<IRestaurantMenuItem>(
    'mRestaurantMenuItem',
    restaurantMenuItemSchema
);
