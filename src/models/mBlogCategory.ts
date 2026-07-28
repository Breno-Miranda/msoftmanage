import { Schema, model, Document } from 'mongoose';

export interface IMBlogCategory extends Document {
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const mBlogCategorySchema = new Schema<IMBlogCategory>(
    {
        name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'mblogcategories'
    }
);

export const mBlogCategory = model<IMBlogCategory>('mBlogCategory', mBlogCategorySchema);
