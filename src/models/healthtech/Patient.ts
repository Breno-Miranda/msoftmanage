import mongoose from 'mongoose';

/**
 * HealthTech Patient Model
 * Implements Module 2 (Patient Management / CRM de Saúde)
 * 
 * Features:
 * - Complete demographic and contact data
 * - Real World Data (RWD) - lifestyle tracking
 * - Patient journey mapping
 * - Pharmacological profile
 * - LGPD compliance fields
 * - Segmentation tags
 */
const PatientSchema = new mongoose.Schema({
    // Multi-tenancy (optional for MVP, required in production)
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', index: true },

    // Basic Info
    name: { type: String, required: true },
    socialName: { type: String }, // Nome social (preferred name)
    cpf: { type: String, sparse: true }, // Sparse index allows multiple nulls
    rg: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    photo: { type: String }, // URL to photo

    // Contact (Enhanced)
    contact: {
        email: { type: String },
        phone: { type: String },
        whatsapp: { type: String },
        preferredContact: { type: String, enum: ['email', 'phone', 'whatsapp', 'sms'], default: 'whatsapp' },
        bestTimeToContact: { type: String } // e.g., "morning", "afternoon", "evening"
    },

    // Address
    address: {
        street: { type: String },
        number: { type: String },
        complement: { type: String },
        neighborhood: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String, default: 'Brasil' }
    },

    // Emergency Contact
    emergencyContact: {
        name: { type: String },
        relationship: { type: String },
        phone: { type: String }
    },

    // Lifestyle (Real World Data - RWD for personalization)
    lifestyle: {
        occupation: { type: String },
        workSchedule: { type: String, enum: ['day', 'night', 'rotating', 'flexible'] },
        physicalActivity: {
            type: String,
            enum: ['sedentary', 'light', 'moderate', 'intense'],
            default: 'sedentary'
        },
        physicalActivityDetails: { type: String }, // e.g., "runs 3x/week"
        smoking: {
            current: { type: Boolean, default: false },
            former: { type: Boolean, default: false },
            yearsSmoked: { type: Number }
        },
        alcoholConsumption: {
            type: String,
            enum: ['none', 'occasional', 'moderate', 'heavy'],
            default: 'none'
        },
        dietType: {
            type: String,
            enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'other'],
            default: 'omnivore'
        },
        dietRestrictions: [{ type: String }], // e.g., ['lactose-free', 'gluten-free']
        sleepQuality: {
            type: String,
            enum: ['poor', 'fair', 'good', 'excellent'],
            default: 'good'
        },
        sleepHoursAverage: { type: Number },
        stressLevel: {
            type: String,
            enum: ['low', 'moderate', 'high', 'very_high'],
            default: 'moderate'
        },
        sunExposure: { type: String, enum: ['minimal', 'moderate', 'high'] },
        waterIntake: { type: String } // e.g., "2L/day"
    },

    // Patient Journey (Jornada do Paciente)
    journey: {
        firstContact: { type: Date, default: Date.now },
        firstPurchase: { type: Date },
        lastVisit: { type: Date },
        lastPurchase: { type: Date },
        totalVisits: { type: Number, default: 0 },
        totalPurchases: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        averageTicket: { type: Number, default: 0 },
        currentPhase: {
            type: String,
            enum: ['lead', 'prospect', 'first_visit', 'active', 'loyal', 'at_risk', 'churned'],
            default: 'first_visit'
        },
        churnRisk: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        },
        source: { type: String }, // How they found the pharmacy
        referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },

        // Personalization Preferences
        preferences: {
            preferredFormulation: { type: String }, // e.g., "sem lactose", "vegano"
            preferredFlavor: { type: String }, // e.g., "morango", "sem sabor"
            preferredForm: { type: String }, // e.g., "cápsulas", "gomas"
            packagingPreference: { type: String }, // e.g., "dosador semanal"
            allowsGenericSubstitution: { type: Boolean, default: true }
        }
    },

    // Tags for Segmentation (Marketing & Education)
    tags: [{ type: String }], // e.g., ['dermocosmetics', 'hormonal', 'supplements', 'pediatric']

    // Clinical Profile
    active: { type: Boolean, default: true },

    // LGPD & Compliance (Module 1)
    lgpd: {
        consent: { type: Boolean, required: true, default: false },
        consentDate: { type: Date },
        consentVersion: { type: String }, // Version of terms accepted
        marketingConsent: { type: Boolean, default: false },
        marketingConsentDate: { type: Date },
        dataPortabilityRequested: { type: Boolean, default: false },
        dataPortabilityRequestDate: { type: Date },
        deletionRequested: { type: Boolean, default: false },
        deletionRequestDate: { type: Date }
    },

    // Clinical Data (Module 3 support)
    allergies: [{
        substance: { type: String, required: true },
        severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
        reaction: { type: String },
        discoveredDate: { type: Date }
    }],

    chronicConditions: [{
        condition: { type: String, required: true },
        diagnosedDate: { type: Date },
        status: { type: String, enum: ['active', 'controlled', 'resolved'] },
        notes: { type: String }
    }],

    // Family History
    familyHistory: [{
        condition: { type: String },
        relationship: { type: String }, // e.g., "mother", "father"
        notes: { type: String }
    }],

    // Medications (Module 2 - Pharmacological Profile)
    medications: [{
        name: { type: String, required: true },
        activeIngredient: { type: String },
        dosage: { type: String },
        frequency: { type: String },
        route: { type: String }, // oral, topical, etc.
        prescriber: { type: String },
        prescriberCRM: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        isActive: { type: Boolean, default: true },
        isContinuous: { type: Boolean, default: false },
        purpose: { type: String }, // Why they take it
        notes: { type: String }
    }],

    // Current Health Metrics (últimas aferições)
    healthMetrics: {
        weight: { value: Number, measuredAt: Date },
        height: { value: Number, measuredAt: Date },
        bmi: { value: Number, calculatedAt: Date },
        bloodPressure: {
            systolic: Number,
            diastolic: Number,
            measuredAt: Date
        },
        bloodGlucose: {
            value: Number,
            fasting: Boolean,
            measuredAt: Date
        }
    },

    // Notes
    internalNotes: { type: String }, // Visible only to pharmacy staff

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Indexes for efficient querying
PatientSchema.index({ pharmacyId: 1, name: 'text' });
PatientSchema.index({ pharmacyId: 1, cpf: 1 });
PatientSchema.index({ pharmacyId: 1, 'contact.phone': 1 });
PatientSchema.index({ pharmacyId: 1, 'journey.currentPhase': 1 });
PatientSchema.index({ pharmacyId: 1, tags: 1 });
PatientSchema.index({ pharmacyId: 1, 'journey.lastVisit': -1 });

// Middleware to update updatedAt
PatientSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Virtual for full name display
PatientSchema.virtual('displayName').get(function () {
    return this.socialName || this.name;
});

// Virtual for age
PatientSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
});

export const Patient = mongoose.model('Patient', PatientSchema, 'mhealthTech_patients');
