import mongoose, { Document, Schema, Types } from 'mongoose';
import crypto from 'crypto';

export interface ITableSession extends Document {
    tableId: Types.ObjectId;
    sessionToken: string;
    status: 'ACTIVE' | 'EXPIRED' | 'COMPLETED';
    createdAt: Date;
    expiresAt: Date;
    lastActivityAt: Date;
}

const tableSessionSchema = new Schema<ITableSession>({
    tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
    sessionToken: { type: String, required: true, unique: true },
    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'COMPLETED'], default: 'ACTIVE' },
    expiresAt: { type: Date, required: true },
    lastActivityAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for quick lookups (removed partial unique - was causing issues)
tableSessionSchema.index({ tableId: 1, status: 1 });
tableSessionSchema.index({ expiresAt: 1 });

// Generate a secure session token
export const generateSessionToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

export const TableSession = mongoose.model<ITableSession>('TableSession', tableSessionSchema);
