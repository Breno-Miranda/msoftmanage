import { Schema, Document } from 'mongoose';
import { cursosConnection } from '../../../config/mongoCursos';

export interface ICategory extends Document {
    name: string;
    slug: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String },
    },
    {
        timestamps: true,
        collection: 'categories'
    }
);

export const Category = cursosConnection.model<ICategory>('Category', categorySchema);
