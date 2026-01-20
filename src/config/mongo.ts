import mongoose from 'mongoose';

export const connectMongo = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bun-api';
        await mongoose.connect(mongoUri);

    } catch (error) {


        process.exit(1);
    }
};
