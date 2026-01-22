import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOrderItem {
    menuItemId: Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
}

export interface IOrder extends Document {
    tableId: Types.ObjectId;
    items: IOrderItem[];
    subtotal: number;
    tax: number;
    serviceCharge: number;
    totalAmount: number;
    status: 'CREATED' | 'PENDING_CASH' | 'PAID' | 'PREPARING' | 'READY' | 'SERVED';
    paymentId?: Types.ObjectId;
    sessionId: string;
    customerName?: string;
    customerPhone?: string;
    paymentMethod: 'ONLINE' | 'CASH';
    createdAt: Date;
    updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    specialInstructions: { type: String },
});

const orderSchema = new Schema<IOrder>({
    tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    serviceCharge: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['CREATED', 'PENDING_CASH', 'PAID', 'PREPARING', 'READY', 'SERVED'], default: 'CREATED' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    sessionId: { type: String, required: true },
    customerName: { type: String },
    customerPhone: { type: String },
    paymentMethod: { type: String, enum: ['ONLINE', 'CASH'], default: 'ONLINE' },
}, { timestamps: true });

orderSchema.index({ tableId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
