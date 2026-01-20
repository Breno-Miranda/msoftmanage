import mongoose from 'mongoose';

/**
 * HealthTech Consultation Model
 * Implements Module 3 (Pharmaceutical Office / Consultório Farmacêutico)
 * 
 * Features:
 * - Structured anamnesis (SOAP format support)
 * - Vital signs recording
 * - Clinical services per RDC 44/09
 * - Drug interaction detection
 * - Assessment and plan documentation
 * - Follow-up scheduling
 * - Official document generation (Declaração de Serviço Farmacêutico)
 */
const ConsultationSchema = new mongoose.Schema({
    // References
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    pharmacistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Multi-tenancy (optional for MVP)
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', index: true },

    // Scheduling
    scheduledDate: { type: Date },
    date: { type: Date, default: Date.now },
    duration: { type: Number }, // Duration in minutes
    consultationType: {
        type: String,
        enum: ['walk_in', 'scheduled', 'follow_up', 'emergency'],
        default: 'walk_in'
    },

    // Status tracking
    status: {
        type: String,
        enum: ['scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled'
    },
    startedAt: { type: Date },
    completedAt: { type: Date },

    // SOAP Note Format (Subjective, Objective, Assessment, Plan)
    // SUBJECTIVE - Patient's reported information
    subjective: {
        chiefComplaint: { type: String }, // Queixa principal
        historyOfPresentIllness: { type: String }, // História da doença atual
        symptomDuration: { type: String }, // How long symptoms have been present
        symptomsSeverity: { type: String, enum: ['mild', 'moderate', 'severe'] },
        symptoms: [{
            name: { type: String },
            location: { type: String },
            duration: { type: String },
            frequency: { type: String },
            aggravatingFactors: { type: String },
            relievingFactors: { type: String }
        }],
        pastMedicalHistory: { type: String },
        familyHistory: { type: String },
        socialHistory: { type: String },
        allergiesReported: [{ type: String }],
        currentMedications: [{ type: String }], // Quick list reported by patient
        previousTreatments: { type: String }, // What they've tried
        patientGoals: { type: String } // What they hope to achieve
    },

    // OBJECTIVE - Measurable/observable data
    objective: {
        vitalSigns: {
            bloodPressure: {
                systolic: { type: Number },
                diastolic: { type: Number },
                position: { type: String, enum: ['sitting', 'standing', 'lying'] },
                arm: { type: String, enum: ['left', 'right'] }
            },
            heartRate: { type: Number }, // BPM
            respiratoryRate: { type: Number }, // breaths per minute
            temperature: { type: Number }, // Celsius
            oxygenSaturation: { type: Number }, // SpO2 %
            weight: { type: Number }, // kg
            height: { type: Number }, // cm
            bmi: { type: Number }, // Calculated
            painLevel: { type: Number, min: 0, max: 10 }, // Pain scale 0-10
            bloodGlucose: {
                value: { type: Number }, // mg/dL
                fasting: { type: Boolean },
                hoursAfterMeal: { type: Number }
            }
        },
        physicalExam: { type: String }, // General observations
        laboratoryResults: [{
            testName: { type: String },
            result: { type: String },
            referenceRange: { type: String },
            date: { type: Date }
        }]
    },

    // Clinical Services Performed (per RDC 44/09 and RDC 585/586 CFF)
    servicesPerformed: [{
        type: {
            type: String,
            enum: [
                // Vital Signs
                'blood_pressure_measurement',
                'glucose_test',
                'temperature_measurement',
                'pulse_oximetry',
                'weight_height_bmi',

                // Procedures
                'injection_administration',
                'vaccine_administration',
                'ear_piercing',
                'nebulization',
                'wound_dressing',
                'suture_removal',
                'ostomy_care',

                // Pharmaceutical Services
                'medication_review',
                'pharmacotherapeutic_follow_up',
                'pharmaceutical_consultation',
                'drug_interaction_check',
                'prescription_analysis',
                'therapeutic_monitoring',

                // Health Screening
                'health_screening',
                'risk_assessment',

                'other'
            ],
            required: true
        },
        serviceName: { type: String }, // Display name
        result: { type: String }, // e.g., "120/80 mmHg", "95 mg/dL"
        interpretation: { type: String }, // e.g., "Within normal range"
        notes: { type: String },
        fee: { type: Number, default: 0 },
        paid: { type: Boolean, default: false }
    }],

    // ASSESSMENT - Pharmacist's clinical judgment
    assessment: {
        clinicalImpression: { type: String }, // Overall assessment
        drugRelatedProblems: [{
            type: {
                type: String,
                enum: [
                    'unnecessary_therapy',
                    'needs_additional_therapy',
                    'ineffective_drug',
                    'dosage_too_low',
                    'adverse_reaction',
                    'dosage_too_high',
                    'non_adherence',
                    'drug_interaction'
                ]
            },
            description: { type: String },
            severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
            drugInvolved: { type: String }
        }],
        drugInteractions: [{
            drug1: { type: String },
            drug2: { type: String },
            severity: { type: String, enum: ['minor', 'moderate', 'major', 'contraindicated'] },
            description: { type: String },
            recommendation: { type: String }
        }],
        adherenceAssessment: {
            level: { type: String, enum: ['good', 'partial', 'poor'] },
            barriers: [{ type: String }], // Cost, complexity, side effects, etc.
            notes: { type: String }
        },
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] }
    },

    // PLAN - Actions and recommendations
    plan: {
        interventions: [{
            type: {
                type: String,
                enum: [
                    'patient_education',
                    'prescriber_contact',
                    'dosage_adjustment_recommendation',
                    'therapy_change_recommendation',
                    'adherence_support',
                    'monitoring_plan',
                    'lifestyle_modification',
                    'referral',
                    'pharmaceutical_prescription',
                    'other'
                ]
            },
            description: { type: String },
            status: { type: String, enum: ['planned', 'completed', 'pending'] }
        }],
        patientEducation: [{
            topic: { type: String },
            details: { type: String },
            materialsProvided: [{ type: String }] // URLs or document names
        }],
        recommendations: { type: String }, // General recommendations
        lifestyleRecommendations: { type: String },
        referral: {
            needed: { type: Boolean, default: false },
            specialty: { type: String }, // e.g., "Cardiology", "General Practitioner"
            urgency: { type: String, enum: ['routine', 'urgent', 'emergency'] },
            reason: { type: String },
            referredTo: { type: String } // Doctor name if known
        },
        prescriptionGenerated: { type: Boolean, default: false },
        prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Formula' }
    },

    // Follow-up
    followUp: {
        required: { type: Boolean, default: false },
        scheduledDate: { type: Date },
        intervalDays: { type: Number }, // Days until next follow-up
        goals: { type: String }, // What to evaluate at follow-up
        notes: { type: String }
    },

    // Documents Generated
    documentsGenerated: [{
        type: {
            type: String,
            enum: ['service_declaration', 'referral_letter', 'pharmaceutical_prescription', 'report', 'attestation']
        },
        documentNumber: { type: String },
        documentUrl: { type: String },
        generatedAt: { type: Date, default: Date.now },
        sentToPatient: { type: Boolean, default: false },
        sentAt: { type: Date }
    }],

    // Internal notes (not shown to patient)
    internalNotes: { type: String },

    // Billing
    billing: {
        totalAmount: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        finalAmount: { type: Number, default: 0 },
        paymentStatus: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
        paymentMethod: { type: String },
        paidAt: { type: Date }
    },

    // Patient satisfaction
    satisfaction: {
        rating: { type: Number, min: 1, max: 5 },
        feedback: { type: String },
        submittedAt: { type: Date }
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes
ConsultationSchema.index({ pharmacyId: 1, date: -1 });
ConsultationSchema.index({ patientId: 1, date: -1 });
ConsultationSchema.index({ pharmacistId: 1, date: -1 });
ConsultationSchema.index({ pharmacyId: 1, status: 1 });

// Middleware to update updatedAt
ConsultationSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Middleware to calculate billing total
ConsultationSchema.pre('save', function (next) {
    if (this.servicesPerformed && this.servicesPerformed.length > 0) {
        const total = this.servicesPerformed.reduce((sum, service) => sum + (service.fee || 0), 0);
        if (!this.billing) {
            this.billing = {
                totalAmount: 0,
                discountAmount: 0,
                finalAmount: 0,
                paymentStatus: 'pending' as const
            };
        }
        this.billing.totalAmount = total;
        this.billing.finalAmount = total - (this.billing.discountAmount || 0);
    }
    next();
});

export const Consultation = mongoose.model('Consultation', ConsultationSchema, 'mhealthTech_consultations');
