import mongoose from 'mongoose';

// Schema do Mongoose (Modelagem de Dados)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false }, // Select: false para não vir a senha por padrão
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Middleware para atualizar updatedAt
userSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const User = mongoose.model('User', userSchema);
