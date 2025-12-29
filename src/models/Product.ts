import { Schema, model, Document } from 'mongoose';

/**
 * Interface TypeScript para o Produto
 * Garante tipagem forte em toda a aplicação
 */
export interface IProduct extends Document {
    name: string;
    price: number;
    stock: number;
    description?: string;
    category?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Schema Mongoose para Produto
 * Define a estrutura e validações do documento no MongoDB
 */
const ProductSchema = new Schema<IProduct>(
    {
        name: {
            type: String,
            required: [true, 'Nome do produto é obrigatório'],
            trim: true,
            minlength: [3, 'Nome deve ter no mínimo 3 caracteres'],
            maxlength: [100, 'Nome deve ter no máximo 100 caracteres'],
            index: true, // Índice para buscas mais rápidas
        },
        price: {
            type: Number,
            required: [true, 'Preço é obrigatório'],
            min: [0, 'Preço não pode ser negativo'],
            validate: {
                validator: function (value: number) {
                    // Valida que o preço tem no máximo 2 casas decimais
                    return /^\d+(\.\d{1,2})?$/.test(value.toString());
                },
                message: 'Preço deve ter no máximo 2 casas decimais',
            },
        },
        stock: {
            type: Number,
            required: [true, 'Estoque é obrigatório'],
            min: [0, 'Estoque não pode ser negativo'],
            validate: {
                validator: Number.isInteger,
                message: 'Estoque deve ser um número inteiro',
            },
            default: 0,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Descrição deve ter no máximo 500 caracteres'],
        },
        category: {
            type: String,
            trim: true,
            enum: {
                values: ['Eletrônicos', 'Roupas', 'Alimentos', 'Livros', 'Outros'],
                message: '{VALUE} não é uma categoria válida',
            },
            default: 'Outros',
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        // Adiciona automaticamente createdAt e updatedAt
        timestamps: true,
        // Remove __v do retorno JSON
        versionKey: false,
        // Customiza o retorno JSON
        toJSON: {
            transform: function (doc, ret) {
                ret.id = ret._id;
                delete ret._id;
                return ret;
            },
        },
    }
);

/**
 * Índices compostos para queries otimizadas
 */
ProductSchema.index({ name: 'text', description: 'text' }); // Busca textual
ProductSchema.index({ category: 1, isActive: 1 }); // Filtros comuns
ProductSchema.index({ price: 1 }); // Ordenação por preço

/**
 * Middleware pre-save para validações customizadas
 */
ProductSchema.pre('save', function (next) {
    // Exemplo: converter nome para Title Case
    if (this.isModified('name')) {
        this.name = this.name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    next();
});

/**
 * Métodos de instância
 */
ProductSchema.methods.isInStock = function (): boolean {
    return this.stock > 0 && this.isActive;
};

ProductSchema.methods.decreaseStock = async function (quantity: number): Promise<IProduct> {
    if (quantity > this.stock) {
        throw new Error('Quantidade solicitada maior que o estoque disponível');
    }
    this.stock -= quantity;
    return await this.save();
};

/**
 * Métodos estáticos
 */
ProductSchema.statics.findByCategory = function (category: string) {
    return this.find({ category, isActive: true });
};

ProductSchema.statics.findInStock = function () {
    return this.find({ stock: { $gt: 0 }, isActive: true });
};

/**
 * Model do Produto
 * Exporta o model tipado para uso na aplicação
 */
export const Product = model<IProduct>('Product', ProductSchema);
