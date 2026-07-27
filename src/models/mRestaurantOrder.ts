import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItemAddOn {
    name: string;
    price: number;
}

export interface IOrderItem {
    itemId: string;
    menuItemId: string;
    variationId?: string;
    addOns: IOrderItemAddOn[];
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
}

export interface IRestaurantOrder extends Document {
    uuid: string;
    appKey: string;
    tableId?: string;
    orderType: 'dine_in' | 'takeout';
    items: IOrderItem[];
    subtotal: number;
    serviceFee: number;
    discount: number;
    total: number;
    status: 'open' | 'preparing' | 'ready' | 'closed' | 'canceled';
    paymentStatus: 'pending' | 'paid';
    closedAt?: Date;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const restaurantOrderSchema = new Schema<IRestaurantOrder>(
    {
        uuid: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
        },
        appKey: { type: String, required: true, index: true },
        tableId: { type: String, index: true },
        orderType: {
            type: String,
            enum: ['dine_in', 'takeout'],
            default: 'dine_in',
        },
        items: {
            type: [
                {
                    itemId: { type: String, required: true },
                    menuItemId: { type: String, required: true },
                    variationId: { type: String },
                    addOns: {
                        type: [
                            {
                                name: { type: String, required: true },
                                price: { type: Number, required: true, default: 0 },
                            },
                        ],
                        default: [],
                    },
                    quantity: { type: Number, required: true, default: 1 },
                    unitPrice: { type: Number, required: true, default: 0 },
                    totalPrice: { type: Number, required: true, default: 0 },
                    notes: { type: String },
                },
            ],
            default: [],
        },
        subtotal: { type: Number, required: true, default: 0 },
        serviceFee: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true, default: 0 },
        status: {
            type: String,
            enum: ['open', 'preparing', 'ready', 'closed', 'canceled'],
            default: 'open',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid'],
            default: 'pending',
        },
        closedAt: { type: Date },
        createdBy: { type: String, required: true },
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

restaurantOrderSchema.index({ appKey: 1, status: 1 });
restaurantOrderSchema.index({ appKey: 1, tableId: 1 });
restaurantOrderSchema.index({ appKey: 1, createdAt: -1 });

export const mRestaurantOrder = mongoose.model<IRestaurantOrder>(
    'mRestaurantOrder',
    restaurantOrderSchema
);
