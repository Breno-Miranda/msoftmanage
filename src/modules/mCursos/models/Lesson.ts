import { Schema, Document } from 'mongoose';
import { cursosConnection } from '../../../config/mongoCursos';

export interface ILesson extends Document {
    moduleId: string;
    courseId: string;
    title: string;
    type: 'VIDEO' | 'TEXT' | 'PDF' | 'FILE' | 'QUIZ';
    content: string; // URL do video, texto rico, URL do PDF
    duration: number; // em minutos
    order: number;
    status: 'DRAFT' | 'PUBLISHED';
    isPreview: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
    {
        moduleId: { type: String, required: true, index: true },
        courseId: { type: String, required: true, index: true },
        title: { type: String, required: true },
        type: { type: String, enum: ['VIDEO', 'TEXT', 'PDF', 'FILE', 'QUIZ'], required: true },
        content: { type: String, required: true },
        duration: { type: Number, default: 0 },
        order: { type: Number, default: 0 },
        status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
        isPreview: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        collection: 'lessons'
    }
);

export const Lesson = cursosConnection.model<ILesson>('Lesson', lessonSchema);
