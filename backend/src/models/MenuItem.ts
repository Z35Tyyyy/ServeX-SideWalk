import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItem extends Document {
    name: string;
    description: string;
    category: string;
    price: number;
    imageUrl: string;
    isAvailable: boolean;
    preparationTime: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number, default: 15 },
    tags: [{ type: String }],
}, { timestamps: true });

menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isAvailable: 1 });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
