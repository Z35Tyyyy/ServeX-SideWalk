import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export const createRazorpayOrder = async (amount: number, orderId: string) => {
    const options = {
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: orderId,
        notes: { orderId },
    };
    return razorpay.orders.create(options);
};

export const verifyPaymentSignature = (razorpayOrderId: string, razorpayPaymentId: string, signature: string): boolean => {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(body).digest('hex');
    return expected === signature;
};

export const verifyWebhookSignature = (body: string, signature: string): boolean => {
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '').update(body).digest('hex');
    return expected === signature;
};

export const getRazorpayKeyId = (): string => process.env.RAZORPAY_KEY_ID || '';
