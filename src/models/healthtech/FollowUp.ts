import mongoose from 'mongoose';

/**
 * HealthTech Follow-Up Model
 * Implements Module 6 (Post-Sale & Loyalty - Pharmacotherapeutic Follow-Up)
 * 
 * Features:
 * - Adherence checking
 * - Adverse reaction monitoring
 * - Repurchase reminders
 * - Satisfaction follow-ups
 * - Automated scheduling
 */
const FollowUpSchema = new mongoose.Schema({
    // Multi-tenancy
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },

    // Patient & Related Records
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    formulaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Formula' },
    consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },

    // Follow-up Type
    type: {
        type: String,
        enum: [
            'adherence_check', // Check if patient is taking medication correctly
            'adverse_reaction', // Check for side effects
            'efficacy_check', // Check if treatment is working
            'satisfaction', // General satisfaction
            'repurchase_reminder', // Product running out
            'appointment_reminder', // Upcoming consultation
            'treatment_completion', // End of treatment
            'periodic_check', // Regular check-in
            'post_consultation', // After pharmaceutical consultation
            'birthday', // Birthday greeting
            'custom'
        ],
        required: true
    },

    // Scheduling
    scheduledDate: { type: Date, required: true, index: true },
    scheduledTime: { type: String }, // Preferred time

    // Priority
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    // Contact Method
    contactMethod: {
        primary: { type: String, enum: ['whatsapp', 'phone', 'email', 'sms', 'app'], default: 'whatsapp' },
        fallback: { type: String, enum: ['whatsapp', 'phone', 'email', 'sms', 'app'] }
    },

    // Status
    status: {
        type: String,
        enum: [
            'scheduled', // Waiting for scheduled date
            'pending', // Ready to be executed
            'in_progress', // Contact initiated
            'contacted', // Patient contacted
            'completed', // Follow-up completed
            'no_response', // No response after attempts
            'rescheduled', // Rescheduled for later
            'cancelled' // Cancelled
        ],
        default: 'scheduled'
    },

    // Contact Attempts
    attempts: [{
        date: { type: Date, default: Date.now },
        method: { type: String },
        outcome: {
            type: String,
            enum: ['answered', 'no_answer', 'busy', 'voicemail', 'wrong_number', 'callback_requested', 'completed']
        },
        notes: { type: String },
        contactedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],

    // Pre-defined Message/Script
    message: {
        template: { type: String }, // Template name/ID
        customMessage: { type: String },
        language: { type: String, default: 'pt-BR' }
    },

    // Questionnaire (for structured follow-ups)
    questionnaire: [{
        question: { type: String },
        questionType: { type: String, enum: ['yes_no', 'scale', 'multiple_choice', 'open'] },
        options: [{ type: String }], // For multiple choice
        answer: { type: mongoose.Schema.Types.Mixed },
        answeredAt: { type: Date }
    }],

    // Outcome/Results
    outcome: {
        // Adherence
        adherent: { type: Boolean },
        adherenceLevel: { type: String, enum: ['full', 'partial', 'none'] },
        adherenceBarriers: [{ type: String }], // forgetfulness, cost, side_effects, etc.

        // Adverse Reactions
        adverseReactions: [{
            symptom: { type: String },
            severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
            startDate: { type: Date },
            ongoing: { type: Boolean },
            actionTaken: { type: String }
        }],

        // Efficacy
        efficacyRating: { type: Number, min: 1, max: 5 },
        symptomsImproved: { type: Boolean },
        treatmentGoalMet: { type: Boolean },

        // Satisfaction
        satisfactionScore: { type: Number, min: 1, max: 10 },

        // Repurchase
        willRepurchase: { type: Boolean },
        repurchaseScheduled: { type: Boolean },

        // General
        patientFeedback: { type: String },
        pharmacistNotes: { type: String },
        actionRequired: { type: Boolean, default: false },
        actionDescription: { type: String },
        actionCompleted: { type: Boolean, default: false }
    },

    // Actions Taken Based on Outcome
    actions: [{
        type: {
            type: String,
            enum: [
                'referral_to_doctor',
                'dosage_adjustment',
                'schedule_consultation',
                'send_education_content',
                'create_repurchase_order',
                'update_patient_profile',
                'flag_for_review',
                'no_action',
                'other'
            ]
        },
        description: { type: String },
        completedAt: { type: Date },
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],

    // Next Follow-up
    nextFollowUp: {
        scheduled: { type: Boolean, default: false },
        date: { type: Date },
        type: { type: String },
        followUpId: { type: mongoose.Schema.Types.ObjectId, ref: 'FollowUp' }
    },

    // Automation
    automation: {
        isAutomated: { type: Boolean, default: false },
        triggeredBy: { type: String }, // Rule/trigger name
        automationRuleId: { type: mongoose.Schema.Types.ObjectId }
    },

    // Assignment
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Timing
    completedAt: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    duration: { type: Number }, // Time spent in minutes

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Indexes
FollowUpSchema.index({ pharmacyId: 1, scheduledDate: 1 });
FollowUpSchema.index({ pharmacyId: 1, status: 1 });
FollowUpSchema.index({ pharmacyId: 1, patientId: 1, type: 1 });
FollowUpSchema.index({ assignedTo: 1, scheduledDate: 1 });
FollowUpSchema.index({ pharmacyId: 1, 'outcome.actionRequired': 1 });

// Middleware to update updatedAt
FollowUpSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Method to add attempt
FollowUpSchema.methods.addAttempt = function (
    method: string,
    outcome: 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number' | 'callback_requested' | 'completed',
    notes?: string,
    contactedBy?: mongoose.Types.ObjectId
) {
    this.attempts.push({
        date: new Date(),
        method,
        outcome,
        notes,
        contactedBy
    });

    if (outcome === 'completed') {
        this.status = 'completed';
        this.completedAt = new Date();
    } else if (outcome === 'answered') {
        this.status = 'in_progress';
    } else if (this.attempts.length >= 3) {
        this.status = 'no_response';
    } else {
        this.status = 'pending';
    }

    return this.save();
};

// Method to complete follow-up
FollowUpSchema.methods.complete = function (
    outcome: any,
    completedBy: mongoose.Types.ObjectId
) {
    this.outcome = { ...this.outcome, ...outcome };
    this.status = 'completed';
    this.completedAt = new Date();
    this.completedBy = completedBy;

    return this.save();
};

export const FollowUp = mongoose.model('FollowUp', FollowUpSchema, 'mhealthTech_follow_ups');

/**
 * Follow-Up Automation Rules
 */
const FollowUpRuleSchema = new mongoose.Schema({
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },

    name: { type: String, required: true },
    description: { type: String },

    // Trigger
    trigger: {
        event: {
            type: String,
            enum: [
                'formula_delivered', // When formula is delivered
                'consultation_completed', // After consultation
                'purchase', // After purchase
                'registration', // After patient registration
                'scheduled' // Based on formula recurring period
            ],
            required: true
        },
        daysAfter: { type: Number, default: 3 }, // Days after event
        filterByCategory: { type: String }, // Only for specific therapeutic categories
        filterByFormType: { type: String } // Only for specific form types
    },

    // Follow-up Settings
    followUpType: { type: String, required: true },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    messageTemplate: { type: String },

    // Active
    active: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now }
});

export const FollowUpRule = mongoose.model('FollowUpRule', FollowUpRuleSchema, 'mhealthTech_follow_up_rules');
