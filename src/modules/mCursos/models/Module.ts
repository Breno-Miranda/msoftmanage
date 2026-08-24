import { Schema, Document } from 'mongoose';
import { cursosConnection } from '../../../config/mongoCursos';

export interface IModule extends Document {
    courseId: string;
    title: string;
    description?: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const moduleSchema = new Schema<IModule>(
    {
        courseId: { type: String, required: true, index: true },
        title: { type: String, required: true },
        description: { type: String },
        order: { type: Number, default: 0 },
    },
    {
        timestamps: true,
        collection: 'modules'
    }
);

export const Module = cursosConnection.model<IModule>('Module', moduleSchema);
