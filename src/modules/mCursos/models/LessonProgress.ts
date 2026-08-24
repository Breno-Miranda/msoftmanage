import { Schema, Document } from 'mongoose';
import { cursosConnection } from '../../../config/mongoCursos';

export interface ILessonProgress extends Document {
    enrollmentId: string;
    studentId: string;
    lessonId: string;
    courseId: string;
    isCompleted: boolean;
    watchedSeconds: number;
    lastAccessedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const lessonProgressSchema = new Schema<ILessonProgress>(
    {
        enrollmentId: { type: String, required: true, index: true },
        studentId: { type: String, required: true, index: true },
        lessonId: { type: String, required: true, index: true },
        courseId: { type: String, required: true, index: true },
        isCompleted: { type: Boolean, default: false },
        watchedSeconds: { type: Number, default: 0 },
        lastAccessedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
        collection: 'lesson_progress'
    }
);

// Unique compound index so a student only has one progress record per lesson
lessonProgressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });

export const LessonProgress = cursosConnection.model<ILessonProgress>('LessonProgress', lessonProgressSchema);
