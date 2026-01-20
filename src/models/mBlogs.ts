import { Schema, model, Document } from 'mongoose';

export interface IMBlog extends Document {
    title: string;
    slug: string;
    subtitle?: string;
    content: string;
    description?: string;
    author: string; // or User ID
    imageUrl?: string;
    tags: string[];
    category?: string;
    published: boolean;
    featured: boolean;
    views: number;
    createdAt: Date;
    updatedAt: Date;
}

const mBlogSchema = new Schema<IMBlog>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        subtitle: { type: String },
        content: { type: String, required: true },
        description: { type: String }, // For SEO meta description
        author: { type: String, required: true },
        imageUrl: { type: String },
        tags: [{ type: String }],
        category: { type: String },
        published: { type: Boolean, default: false },
        featured: { type: Boolean, default: false },
        views: { type: Number, default: 0 }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'mblogs'
    }
);

// Pre-save hook to generate slug if not provided? 
// For now we assume controller handles unique slug generation or client sends it.

export const mBlog = model<IMBlog>('mBlog', mBlogSchema);
