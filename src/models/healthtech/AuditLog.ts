import mongoose from 'mongoose';

/**
 * HealthTech Audit Log Model
 * Implements Module 1 (LGPD Compliance)
 * 
 * Logs all data access and modifications for audit trail.
 * Required for LGPD compliance and security.
 */
const AuditLogSchema = new mongoose.Schema({
    // Who
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String }, // Denormalized for quick reference
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },

    // What
    action: {
        type: String,
        enum: ['create', 'read', 'update', 'delete', 'export', 'login', 'logout', 'failed_login'],
        required: true
    },

    // On What
    collection: { type: String, required: true }, // e.g., 'Patient', 'Consultation'
    documentId: { type: mongoose.Schema.Types.ObjectId },
    documentSummary: { type: String }, // e.g., "Patient: João Silva"

    // Data Changes (for update actions)
    changes: {
        previousData: { type: mongoose.Schema.Types.Mixed }, // Sensitive fields should be encrypted
        newData: { type: mongoose.Schema.Types.Mixed }
    },

    // Context
    ipAddress: { type: String },
    userAgent: { type: String },
    endpoint: { type: String }, // API endpoint accessed
    method: { type: String }, // HTTP method

    // Result
    success: { type: Boolean, default: true },
    errorMessage: { type: String },

    // Metadata
    timestamp: { type: Date, default: Date.now, index: true },

    // LGPD specific
    sensitiveDataAccessed: { type: Boolean, default: false }, // Flag if PHI was accessed
    dataCategoryAccessed: [{
        type: String,
        enum: ['personal', 'health', 'financial', 'biometric']
    }]
});

// Indexes for efficient querying
AuditLogSchema.index({ pharmacyId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ collection: 1, documentId: 1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index - auto-delete logs after retention period (configurable per pharmacy)
// Default: 5 years for health data (per LGPD recommendations)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 157680000 }); // ~5 years

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema, 'mhealthTech_audit_logs');

/**
 * Utility function to create audit log entry
 */
export async function createAuditLog(data: {
    userId: mongoose.Types.ObjectId;
    userEmail?: string;
    pharmacyId: mongoose.Types.ObjectId;
    action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout' | 'failed_login';
    collection: string;
    documentId?: mongoose.Types.ObjectId;
    documentSummary?: string;
    changes?: { previousData?: any; newData?: any };
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    success?: boolean;
    errorMessage?: string;
    sensitiveDataAccessed?: boolean;
    dataCategoryAccessed?: ('personal' | 'health' | 'financial' | 'biometric')[];
}) {
    try {
        const log = new AuditLog(data);
        await log.save();
        return log;
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging should not break main operations
        return null;
    }
}
