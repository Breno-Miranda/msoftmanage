import mongoose from 'mongoose';

const maskMongoUri = (uri: string) => uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

export const connectMongo = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bun-api';
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected:', maskMongoUri(mongoUri));
    } catch (error: any) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};
