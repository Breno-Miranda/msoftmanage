import mongoose from 'mongoose';

/**
 * HealthTech Pharmacy Model
 * Implements Module 1 (White-Label Multi-Tenancy)
 * 
 * Each pharmacy is a tenant in the system with its own branding,
 * patients, and configuration.
 */
const PharmacySchema = new mongoose.Schema({
    // Basic Info
    name: { type: String, required: true },
    tradeName: { type: String }, // Nome fantasia
    cnpj: { type: String, required: true, unique: true },
    crf: { type: String, required: true }, // Registro no Conselho Regional de Farmácia

    // Address
    address: {
        street: { type: String, required: true },
        number: { type: String, required: true },
        complement: { type: String },
        neighborhood: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true }
    },

    // Contact
    contact: {
        phone: { type: String, required: true },
        whatsapp: { type: String },
        email: { type: String, required: true },
        website: { type: String }
    },

    // White-Label Branding
    branding: {
        logo: { type: String }, // URL to logo
        favicon: { type: String },
        primaryColor: { type: String, default: '#0F766E' }, // Teal-700
        secondaryColor: { type: String, default: '#14B8A6' }, // Teal-500
        accentColor: { type: String, default: '#F0FDFA' }, // Teal-50
        fontFamily: { type: String, default: 'Inter' }
    },

    // Responsible Pharmacist (RT)
    responsiblePharmacist: {
        name: { type: String, required: true },
        crf: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },

    // Operating Hours
    operatingHours: [{
        dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday
        openTime: { type: String }, // "08:00"
        closeTime: { type: String }, // "18:00"
        closed: { type: Boolean, default: false }
    }],

    // Settings
    settings: {
        // Services offered
        servicesOffered: [{
            type: { type: String },
            enabled: { type: Boolean, default: true },
            price: { type: Number, default: 0 }
        }],

        // Notifications
        notifications: {
            repurchaseReminder: { type: Boolean, default: true },
            repurchaseReminderDays: { type: Number, default: 7 }, // Days before product runs out
            followUpEnabled: { type: Boolean, default: true },
            followUpDays: { type: Number, default: 3 }, // Days after first use
            birthdayGreeting: { type: Boolean, default: true },
            npsEnabled: { type: Boolean, default: true },
            npsTriggerDays: { type: Number, default: 2 } // Days after service
        },

        // LGPD
        lgpdConsent: {
            termsUrl: { type: String },
            privacyPolicyUrl: { type: String },
            dataRetentionYears: { type: Number, default: 5 }
        },

        // Integrations
        integrations: {
            validaMagistral: { enabled: { type: Boolean, default: false }, apiKey: String },
            whatsappBusiness: { enabled: { type: Boolean, default: false }, phoneId: String, token: String }
        }
    },

    // Subscription
    subscription: {
        plan: { type: String, enum: ['free', 'starter', 'professional', 'enterprise'], default: 'free' },
        status: { type: String, enum: ['active', 'trial', 'suspended', 'cancelled'], default: 'trial' },
        trialEndsAt: { type: Date },
        currentPeriodEnd: { type: Date },
        maxUsers: { type: Number, default: 3 },
        maxPatients: { type: Number, default: 100 }
    },

    active: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Middleware to update updatedAt
PharmacySchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const Pharmacy = mongoose.model('Pharmacy', PharmacySchema, 'mhealthTech_pharmacies');
