import mongoose from 'mongoose';

/**
 * HealthTech Education Content Model
 * Implements Module 5 (Education & Health Tips / Dicas de Saúde)
 * 
 * Features:
 * - Segmented content delivery based on patient profile
 * - Multiple content types (tips, articles, videos)
 * - Trigger-based automation
 * - Marketing automation support
 * - Fake news combat through verified content
 */
const EducationContentSchema = new mongoose.Schema({
    // Multi-tenancy
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },

    // Content Info
    title: { type: String, required: true },
    slug: { type: String }, // URL-friendly version
    summary: { type: String }, // Short description
    content: { type: String, required: true }, // Main content (supports markdown)

    // Content Type
    type: {
        type: String,
        enum: ['tip', 'article', 'video', 'infographic', 'ebook', 'podcast', 'quiz', 'newsletter'],
        default: 'tip'
    },

    // Media
    media: {
        featuredImage: { type: String }, // URL
        videoUrl: { type: String },
        audioUrl: { type: String },
        downloadableFile: { type: String }, // For ebooks, PDFs
        gallery: [{ type: String }] // Multiple images
    },

    // Categorization
    category: {
        type: String,
        enum: [
            'skincare',
            'nutrition',
            'supplements',
            'hormonal_health',
            'sleep',
            'stress',
            'exercise',
            'weight_management',
            'hair_health',
            'pediatric',
            'geriatric',
            'womens_health',
            'mens_health',
            'mental_health',
            'chronic_conditions',
            'seasonal',
            'vaccines',
            'general_health',
            'pharmacy_services',
            'other'
        ]
    },

    // Tags for matching with patient profiles
    tags: [{ type: String }], // e.g., ['dermocosmetics', 'anti-aging', 'hydration']

    // Target Audience
    targetAudience: {
        segments: [{
            type: String,
            enum: ['all', 'new_patients', 'returning', 'at_risk', 'loyal', 'inactive']
        }],
        ageRange: {
            min: { type: Number },
            max: { type: Number }
        },
        gender: [{ type: String, enum: ['male', 'female', 'other', 'all'] }],
        patientTags: [{ type: String }], // Match with patient.tags
        therapeuticCategories: [{ type: String }] // Match with formula categories
    },

    // Trigger Events (for automation)
    triggers: [{
        event: {
            type: String,
            enum: [
                'registration', // When patient registers
                'first_purchase', // First purchase
                'purchase', // Any purchase
                'purchase_category', // Purchase in specific category
                'days_after_purchase', // X days after purchase
                'before_repurchase', // Before product runs out
                'consultation_completed', // After consultation
                'birthday', // On patient's birthday
                'seasonal', // Based on season/date
                'manual' // Manually triggered
            ]
        },
        category: { type: String }, // For purchase_category
        daysAfter: { type: Number }, // For days_after_purchase
        date: { type: Date } // For seasonal
    }],

    // Delivery Settings
    delivery: {
        channels: [{
            type: String,
            enum: ['app', 'email', 'whatsapp', 'sms', 'push_notification']
        }],
        preferredTime: { type: String }, // e.g., "morning", "afternoon"
        frequency: {
            type: String,
            enum: ['once', 'daily', 'weekly', 'monthly', 'on_trigger']
        }
    },

    // Engagement Tracking
    engagement: {
        views: { type: Number, default: 0 },
        uniqueViews: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 }, // For links within content
        completionRate: { type: Number, default: 0 }, // For videos/articles
        averageTimeSpent: { type: Number, default: 0 } // In seconds
    },

    // Scientific Verification (Fake News Combat)
    verification: {
        isVerified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: { type: Date },
        sources: [{ type: String }], // Scientific sources/references
        lastReviewedAt: { type: Date }
    },

    // SEO for public content
    seo: {
        metaTitle: { type: String },
        metaDescription: { type: String },
        keywords: [{ type: String }]
    },

    // Status
    status: {
        type: String,
        enum: ['draft', 'review', 'scheduled', 'published', 'archived'],
        default: 'draft'
    },
    publishedAt: { type: Date },
    scheduledFor: { type: Date },

    // Access control
    visibility: {
        type: String,
        enum: ['public', 'patients_only', 'premium_only'],
        default: 'patients_only'
    },

    // Internal
    active: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Indexes
EducationContentSchema.index({ pharmacyId: 1, status: 1 });
EducationContentSchema.index({ pharmacyId: 1, category: 1 });
EducationContentSchema.index({ pharmacyId: 1, tags: 1 });
EducationContentSchema.index({ pharmacyId: 1, 'triggers.event': 1 });
EducationContentSchema.index({ pharmacyId: 1, publishedAt: -1 });

// Text index for search
EducationContentSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Middleware to update updatedAt
EducationContentSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Middleware to generate slug
EducationContentSchema.pre('save', function (next) {
    if (this.title && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

export const EducationContent = mongoose.model('EducationContent', EducationContentSchema, 'mhealthTech_education_content');
