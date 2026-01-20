import mongoose from 'mongoose';

/**
 * HealthTech Formula Model
 * Implements Module 4 (Formulation & Prescription / Formulação e Prescrição)
 * 
 * Features:
 * - Custom formula/template management
 * - Pharmaceutical prescription (MIPs, phytotherapics, nutraceuticals per CFF 585/586)
 * - External prescription handling
 * - Ingredient composition with validation
 * - Innovative pharmaceutical forms
 * - Production tracking
 * - Pricing and repurchase support
 */

// List of active ingredients that pharmacists CAN prescribe (per CFF Resolution 586)
// This is a simplified list - in production, this would be a separate collection
const PHARMACIST_PRESCRIBABLE_CATEGORIES = [
    'mip', // OTC medications
    'phytotherapic', // Herbal medicines
    'nutraceutical', // Nutraceuticals/Supplements
    'vitamin', // Vitamins
    'mineral', // Minerals
    'probiotic', // Probiotics
    'homeopathic', // Homeopathic preparations
    'flower_essence' // Bach flowers, etc.
];

const FormulaSchema = new mongoose.Schema({
    // Multi-tenancy (optional for MVP)
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', index: true },

    // Basic Info
    name: { type: String, required: true }, // e.g., "Creme Anti-idade da Sra. Maria"
    internalCode: { type: String }, // Pharmacy's internal code
    description: { type: String },

    // Personalization - link to patient (null = template)
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', index: true },
    consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },

    // Prescription Type & Origin
    prescriptionType: {
        type: String,
        enum: [
            'compounding', // Traditional compounding from external prescription
            'pharmaceutical_prescription', // Prescribed by the pharmacist
            'recommendation', // Just a recommendation (no prescription)
            'refill' // Repeat of previous formula
        ],
        required: true,
        default: 'compounding'
    },

    // Who prescribed/created
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    prescribedByName: { type: String },
    prescriptionDate: { type: Date, default: Date.now },

    // External Prescription (when from doctor/dentist)
    externalPrescription: {
        type: { type: String, enum: ['medical', 'dental', 'veterinary', 'other'] },
        prescriberId: { type: String }, // CRM/CRO/CRMV number
        prescriberName: { type: String },
        prescriberSpecialty: { type: String },
        originalDocument: { type: String }, // URL to scanned prescription
        receivedDate: { type: Date },
        validUntil: { type: Date }, // Prescription expiration
        controlledSubstance: { type: Boolean, default: false },
        controlType: { type: String } // e.g., "C1", "C2", "A", "B1"
    },

    // Therapeutic Category
    therapeuticCategory: {
        type: String,
        enum: [
            'dermocosmetic',
            'hormonal',
            'supplement',
            'phytotherapic',
            'homeopathic',
            'pediatric',
            'geriatric',
            'veterinary',
            'oral_health',
            'ophthalmologic',
            'pain_management',
            'gastrointestinal',
            'cardiovascular',
            'neurological',
            'immunological',
            'other'
        ]
    },

    // Composition
    ingredients: [{
        name: { type: String, required: true },
        nameScientific: { type: String }, // Scientific/INCI name
        concentration: { type: String, required: true }, // e.g., "5%", "100mg"
        concentrationValue: { type: Number }, // Numeric value for calculations
        concentrationUnit: { type: String }, // e.g., "mg", "g", "%", "UI"
        quantityPerUnit: { type: Number }, // Quantity per capsule/dose
        category: {
            type: String,
            enum: ['active', 'excipient', 'vehicle', 'flavoring', 'preservative', 'colorant', 'adjuvant'],
            default: 'active'
        },
        prescriptionCategory: {
            type: String,
            enum: ['mip', 'phytotherapic', 'nutraceutical', 'vitamin', 'mineral', 'probiotic', 'homeopathic', 'flower_essence', 'controlled', 'restricted'],
            default: 'nutraceutical'
        },
        canPharmacistPrescribe: { type: Boolean, default: false }, // Per CFF 585/586
        function: { type: String }, // What this ingredient does
        source: { type: String }, // Supplier/source
        cost: { type: Number }, // Cost per unit
        inStock: { type: Boolean, default: true }
    }],

    // Pharmaceutical Form (including innovative forms per Farmácia 4.0)
    form: {
        type: String,
        required: true,
        enum: [
            // Traditional
            'capsule',
            'tablet',
            'cream',
            'gel',
            'ointment',
            'lotion',
            'solution',
            'suspension',
            'syrup',
            'elixir',
            'drops',
            'spray',
            'powder',
            'suppository',
            'ovule',

            // Innovative (Farmácia 4.0)
            'gummy', // Gomas
            'lollipop', // Pirulitos
            'chocolate', // Chocolates medicados
            'oral_film', // Filmes orais / Strips
            'oral_jelly', // Gelatina oral
            'effervescent', // Efervescente
            'sublingual', // Sublingual
            'transdermal', // Transdérmico
            'nasal_spray', // Spray nasal
            'inhaler', // Inalador
            'stick', // Bastão
            'sheet_mask', // Máscara facial
            'serum', // Sérum
            'ampule', // Ampola

            'other'
        ]
    },
    formDetails: {
        color: { type: String },
        flavor: { type: String }, // Sabor
        aroma: { type: String },
        sugarFree: { type: Boolean, default: false },
        lactoseFree: { type: Boolean, default: false },
        glutenFree: { type: Boolean, default: false },
        veganFriendly: { type: Boolean, default: false },
        allergenFree: [{ type: String }], // List of allergens avoided
        size: { type: String }, // Size of tablet, capsule type, etc.
        coating: { type: String } // Enteric coating, etc.
    },

    // Dosage Instructions
    dosage: {
        quantityPerDose: { type: String }, // "1 cápsula", "5ml"
        dosesPerDay: { type: Number },
        frequency: { type: String }, // "2x ao dia", "a cada 8 horas"
        administration: { type: String }, // "antes das refeições", "ao deitar"
        duration: { type: String }, // "30 dias", "uso contínuo"
        totalUnits: { type: Number }, // Total capsules, ml, etc.
        route: {
            type: String,
            enum: ['oral', 'topical', 'sublingual', 'intranasal', 'inhalation', 'rectal', 'vaginal', 'ophthalmic', 'otic', 'transdermal', 'parenteral', 'other'],
            default: 'oral'
        }
    },

    // Usage & Warnings
    usageInstructions: { type: String },
    warnings: [{ type: String }],
    contraindications: [{ type: String }],
    drugInteractions: [{
        drug: { type: String },
        interaction: { type: String },
        severity: { type: String, enum: ['minor', 'moderate', 'major'] }
    }],
    sideEffects: [{ type: String }],
    storageInstructions: { type: String }, // "Manter em local fresco"

    // Production Tracking
    production: {
        status: {
            type: String,
            enum: ['pending', 'queued', 'in_production', 'quality_control', 'ready', 'delivered', 'cancelled'],
            default: 'pending'
        },
        priority: { type: String, enum: ['normal', 'urgent', 'express'], default: 'normal' },
        lot: { type: String },
        manufacturingDate: { type: Date },
        expirationDate: { type: Date },
        shelfLifeDays: { type: Number },
        quantity: { type: Number },
        producedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        producedAt: { type: Date },
        qualityCheckedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        qualityCheckedAt: { type: Date },
        qualityNotes: { type: String },
        deliveredAt: { type: Date },
        deliveryMethod: { type: String, enum: ['pickup', 'delivery', 'mail'] },
        trackingCode: { type: String }
    },

    // Pricing
    pricing: {
        ingredientsCost: { type: Number, default: 0 },
        laborCost: { type: Number, default: 0 },
        packagingCost: { type: Number, default: 0 },
        totalCost: { type: Number, default: 0 },
        markup: { type: Number, default: 2 }, // Multiplier
        price: { type: Number, default: 0 },
        discountPercent: { type: Number, default: 0 },
        finalPrice: { type: Number, default: 0 }
    },

    // Template/Recurring settings
    isTemplate: { type: Boolean, default: false },
    templateName: { type: String },
    parentFormulaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Formula' }, // If cloned from another

    isRecurring: { type: Boolean, default: false },
    recurringPeriodDays: { type: Number }, // For repurchase reminders
    lastOrderDate: { type: Date },
    nextReminderDate: { type: Date },

    // Order history linkage
    orderCount: { type: Number, default: 0 },

    // Tags for categorization
    tags: [{ type: String }],

    // Status
    active: { type: Boolean, default: true },

    // Internal Notes
    internalNotes: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Indexes
FormulaSchema.index({ pharmacyId: 1, patientId: 1 });
FormulaSchema.index({ pharmacyId: 1, isTemplate: 1 });
FormulaSchema.index({ pharmacyId: 1, 'production.status': 1 });
FormulaSchema.index({ pharmacyId: 1, therapeuticCategory: 1 });
FormulaSchema.index({ pharmacyId: 1, createdAt: -1 });

// Middleware to update updatedAt
FormulaSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Middleware to calculate pricing
FormulaSchema.pre('save', function (next) {
    if (this.pricing) {
        // Calculate total cost
        const ingredientsCost = this.pricing.ingredientsCost || 0;
        const laborCost = this.pricing.laborCost || 0;
        const packagingCost = this.pricing.packagingCost || 0;
        this.pricing.totalCost = ingredientsCost + laborCost + packagingCost;

        // Calculate price with markup
        const markup = this.pricing.markup || 2;
        this.pricing.price = this.pricing.totalCost * markup;

        // Apply discount
        const discount = this.pricing.discountPercent || 0;
        this.pricing.finalPrice = this.pricing.price * (1 - discount / 100);
    }
    next();
});

// Middleware to validate pharmaceutical prescription
FormulaSchema.pre('save', function (next) {
    if (this.prescriptionType === 'pharmaceutical_prescription') {
        // Validate that all active ingredients can be prescribed by pharmacist
        const hasRestrictedIngredients = this.ingredients?.some(
            ing => ing.category === 'active' && !ing.canPharmacistPrescribe
        );

        if (hasRestrictedIngredients) {
            const error = new Error('Pharmaceutical prescription contains ingredients that cannot be prescribed by a pharmacist');
            return next(error);
        }
    }
    next();
});

// Virtual for production age (days since manufacturing)
FormulaSchema.virtual('productionAge').get(function () {
    if (!this.production?.manufacturingDate) return null;
    const now = new Date();
    const manufactured = new Date(this.production.manufacturingDate);
    return Math.floor((now.getTime() - manufactured.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for days until expiration
FormulaSchema.virtual('daysUntilExpiration').get(function () {
    if (!this.production?.expirationDate) return null;
    const now = new Date();
    const expiration = new Date(this.production.expirationDate);
    return Math.floor((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
});

export const Formula = mongoose.model('Formula', FormulaSchema, 'mhealthTech_formulas');

// Export prescribable categories for use in validation
export { PHARMACIST_PRESCRIBABLE_CATEGORIES };
