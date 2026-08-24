import { Schema, Document } from 'mongoose';
import { cursosConnection } from '../../../config/mongoCursos';

export interface IEnrollment extends Document {
    courseId: string;
    studentId: string; // mAuth ID
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELED';
    progressPercentage: number;
    enrolledAt: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
    {
        courseId: { type: String, required: true, index: true },
        studentId: { type: String, required: true, index: true },
        status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'CANCELED'], default: 'ACTIVE' },
        progressPercentage: { type: Number, default: 0 },
        enrolledAt: { type: Date, default: Date.now },
        completedAt: { type: Date }
    },
    {
        timestamps: true,
        collection: 'enrollments'
    }
);

export const Enrollment = cursosConnection.model<IEnrollment>('Enrollment', enrollmentSchema);
