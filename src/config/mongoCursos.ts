import mongoose from 'mongoose';

export let cursosConnection: mongoose.Connection;

export const connectCursosMongo = () => {
    if (cursosConnection) return cursosConnection;

    const mongoUri = process.env.MONGODB_CURSOS_URI || 'mongodb://localhost:27017/m-cursos';
    cursosConnection = mongoose.createConnection(mongoUri);

    cursosConnection.on('connected', () => {
        console.log('✅ MongoDB connected: m-cursos');
    });

    cursosConnection.on('error', (err) => {
        console.error('❌ MongoDB m-cursos connection error:', err);
    });

    return cursosConnection;
};

// Initialize it if needed globally, but better to call connectCursosMongo() in the module startup or use lazily.
connectCursosMongo();
