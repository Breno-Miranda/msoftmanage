import mongoose from 'mongoose';

/**
 * HealthTech Loyalty Program Model
 * Implements Module 6 (Post-Sale & Loyalty / Pós-Venda e Fidelização)
 * 
 * Features:
 * - Points-based loyalty program
 * - Tiered benefits (Bronze, Silver, Gold, Platinum)
 * - NPS satisfaction surveys
 * - Rewards catalog
 * - Transaction history
 */
const LoyaltyProgramSchema = new mongoose.Schema({
    // Multi-tenancy
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },

    // Patient link
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },

    // Loyalty Card
    cardNumber: { type: String, unique: true, sparse: true },
    enrollmentDate: { type: Date, default: Date.now },

    // Points
    points: {
        current: { type: Number, default: 0 },
        lifetime: { type: Number, default: 0 }, // Total earned ever
        redeemed: { type: Number, default: 0 }, // Total redeemed
        expired: { type: Number, default: 0 }, // Total expired
        pending: { type: Number, default: 0 } // Pending confirmation
    },

    // Tier
    tier: {
        current: {
            type: String,
            enum: ['bronze', 'silver', 'gold', 'platinum'],
            default: 'bronze'
        },
        sinceDate: { type: Date, default: Date.now },
        pointsToNextTier: { type: Number },
        expiresAt: { type: Date } // Tier validity
    },

    // Tier thresholds (can be customized per pharmacy)
    tierProgress: {
        silverThreshold: { type: Number, default: 500 },
        goldThreshold: { type: Number, default: 2000 },
        platinumThreshold: { type: Number, default: 5000 }
    },

    // Transaction History
    transactions: [{
        type: {
            type: String,
            enum: ['earned', 'redeemed', 'expired', 'adjusted', 'bonus', 'referral'],
            required: true
        },
        points: { type: Number, required: true },
        balance: { type: Number }, // Balance after transaction
        description: { type: String },
        relatedPurchase: { type: mongoose.Schema.Types.ObjectId }, // Order/Purchase ID
        relatedFormula: { type: mongoose.Schema.Types.ObjectId, ref: 'Formula' },
        referredPatient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
        expiresAt: { type: Date }, // When these points expire
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],

    // Redemption History
    redemptions: [{
        rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoyaltyReward' },
        rewardName: { type: String },
        pointsCost: { type: Number },
        status: {
            type: String,
            enum: ['pending', 'approved', 'delivered', 'cancelled'],
            default: 'pending'
        },
        redeemedAt: { type: Date, default: Date.now },
        deliveredAt: { type: Date },
        notes: { type: String }
    }],

    // NPS (Net Promoter Score)
    nps: {
        lastScore: { type: Number, min: 0, max: 10 },
        lastSurveyDate: { type: Date },
        averageScore: { type: Number },
        surveyCount: { type: Number, default: 0 },
        category: {
            type: String,
            enum: ['detractor', 'passive', 'promoter'] // 0-6, 7-8, 9-10
        }
    },

    // NPS History
    npsSurveys: [{
        score: { type: Number, min: 0, max: 10, required: true },
        feedback: { type: String },
        category: { type: String, enum: ['detractor', 'passive', 'promoter'] },
        touchpoint: { type: String }, // e.g., 'purchase', 'consultation', 'delivery'
        relatedService: { type: mongoose.Schema.Types.ObjectId },
        submittedAt: { type: Date, default: Date.now },
        followedUp: { type: Boolean, default: false },
        followUpNotes: { type: String }
    }],

    // Engagement metrics
    engagement: {
        lastInteraction: { type: Date },
        totalPurchases: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        averageTicket: { type: Number, default: 0 },
        purchaseFrequencyDays: { type: Number }, // Average days between purchases
        referralCount: { type: Number, default: 0 },
        referralConversions: { type: Number, default: 0 }
    },

    // Preferences
    preferences: {
        receiveBirthdayReward: { type: Boolean, default: true },
        receivePointsNotifications: { type: Boolean, default: true },
        receiveExclusiveOffers: { type: Boolean, default: true },
        preferredRewardTypes: [{ type: String }]
    },

    // Referral Program
    referral: {
        code: { type: String, unique: true, sparse: true },
        referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
        referralBonusReceived: { type: Boolean, default: false }
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes
LoyaltyProgramSchema.index({ pharmacyId: 1, patientId: 1 }, { unique: true });
LoyaltyProgramSchema.index({ pharmacyId: 1, 'tier.current': 1 });
LoyaltyProgramSchema.index({ pharmacyId: 1, 'points.current': -1 });
// Note: referral.code already has unique: true in schema definition

// Middleware to update updatedAt
LoyaltyProgramSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Middleware to calculate tier
LoyaltyProgramSchema.pre('save', function (next) {
    const lifetime = this.points?.lifetime || 0;
    const silverThreshold = this.tierProgress?.silverThreshold || 500;
    const goldThreshold = this.tierProgress?.goldThreshold || 2000;
    const platinumThreshold = this.tierProgress?.platinumThreshold || 5000;

    let newTier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    let pointsToNext = silverThreshold - lifetime;

    if (lifetime >= platinumThreshold) {
        newTier = 'platinum';
        pointsToNext = 0;
    } else if (lifetime >= goldThreshold) {
        newTier = 'gold';
        pointsToNext = platinumThreshold - lifetime;
    } else if (lifetime >= silverThreshold) {
        newTier = 'silver';
        pointsToNext = goldThreshold - lifetime;
    }

    if (this.tier?.current !== newTier) {
        this.tier = this.tier || { current: 'bronze', sinceDate: new Date() };
        this.tier.current = newTier;
        this.tier.sinceDate = new Date();
    }
    if (this.tier) {
        this.tier.pointsToNextTier = Math.max(0, pointsToNext);
    }

    next();
});

// Middleware to calculate NPS category
LoyaltyProgramSchema.pre('save', function (next) {
    if (this.nps?.lastScore !== undefined && this.nps.lastScore !== null) {
        const score = this.nps.lastScore;
        if (score >= 9) {
            this.nps.category = 'promoter';
        } else if (score >= 7) {
            this.nps.category = 'passive';
        } else {
            this.nps.category = 'detractor';
        }
    }
    next();
});

// Method to add points
LoyaltyProgramSchema.methods.addPoints = function (
    points: number,
    description: string,
    type: 'earned' | 'bonus' | 'referral' = 'earned',
    expiresInDays?: number
) {
    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

    this.points.current += points;
    this.points.lifetime += points;

    this.transactions.push({
        type,
        points,
        balance: this.points.current,
        description,
        expiresAt,
        createdAt: new Date()
    });

    return this.save();
};

// Method to redeem points
LoyaltyProgramSchema.methods.redeemPoints = function (
    points: number,
    description: string
) {
    if (this.points.current < points) {
        throw new Error('Insufficient points');
    }

    this.points.current -= points;
    this.points.redeemed += points;

    this.transactions.push({
        type: 'redeemed',
        points: -points,
        balance: this.points.current,
        description,
        createdAt: new Date()
    });

    return this.save();
};

// Generate referral code
LoyaltyProgramSchema.methods.generateReferralCode = function () {
    if (!this.referral?.code) {
        const code = `REF${this.patientId.toString().slice(-4).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        this.referral = this.referral || {};
        this.referral.code = code;
    }
    return this.referral.code;
};

export const LoyaltyProgram = mongoose.model('LoyaltyProgram', LoyaltyProgramSchema, 'mhealthTech_loyalty_programs');

/**
 * Loyalty Rewards Catalog
 */
const LoyaltyRewardSchema = new mongoose.Schema({
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },

    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },

    pointsCost: { type: Number, required: true },

    type: {
        type: String,
        enum: ['discount', 'product', 'service', 'gift', 'experience'],
        default: 'discount'
    },

    // For discounts
    discountValue: { type: Number },
    discountType: { type: String, enum: ['percentage', 'fixed'] },

    // Restrictions
    minimumTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'] },
    limitPerPatient: { type: Number },
    totalAvailable: { type: Number },
    totalRedeemed: { type: Number, default: 0 },

    // Validity
    validFrom: { type: Date },
    validUntil: { type: Date },

    active: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const LoyaltyReward = mongoose.model('LoyaltyReward', LoyaltyRewardSchema, 'mhealthTech_loyalty_rewards');
