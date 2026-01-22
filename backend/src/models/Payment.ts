import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPayment extends Document {
    orderId: Types.ObjectId;
    gateway: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    gateway: { type: String, default: 'razorpay' },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
}, { timestamps: true });

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
