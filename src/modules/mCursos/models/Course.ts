import { Schema, Document } from 'mongoose';
import { cursosConnection } from '../../../config/mongoCursos';

export interface ICourse extends Document {
    title: string;
    slug: string;
    shortDescription: string;
    fullDescription?: string;
    instructorId: string; // Ref to mAuth user
    categoryId?: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    price: number;
    createdAt: Date;
    updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        shortDescription: { type: String, required: true },
        fullDescription: { type: String },
        instructorId: { type: String, required: true },
        categoryId: { type: String },
        level: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], default: 'BEGINNER' },
        status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
        price: { type: Number, default: 0 },
    },
    {
        timestamps: true,
        collection: 'courses'
    }
);

export const Course = cursosConnection.model<ICourse>('Course', courseSchema);
