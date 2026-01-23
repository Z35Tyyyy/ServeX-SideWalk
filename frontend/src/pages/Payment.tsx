import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { getOrder, createPayment, verifyPayment, confirmCashPayment } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../lib/utils';

declare global { interface Window { Razorpay: any; } }

export default function Payment() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const clearCart = useCartStore((s) => s.clearCart);
    const [order, setOrder] = useState<any>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'processing' | 'success' | 'failed'>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!orderId) return;
        getOrder(orderId).then((r) => { if (r.data.status !== 'CREATED') navigate(`/order/${orderId}`); else { setOrder(r.data); setState('ready'); } }).catch(() => { setError('Order not found'); setState('failed'); });
    }, [orderId, navigate]);

    const handlePayment = async () => {
        if (!order || !orderId) return;
        setState('processing');
        try {
            const { data } = await createPayment(orderId);
            const options = {
                key: data.keyId, amount: data.amount, currency: data.currency, name: 'Sidewalk', order_id: data.razorpayOrderId,
                handler: async (res: any) => {
                    try { await verifyPayment({ orderId, razorpayOrderId: res.razorpay_order_id, razorpayPaymentId: res.razorpay_payment_id, razorpaySignature: res.razorpay_signature }); setState('success'); clearCart(); setTimeout(() => navigate(`/order/${orderId}`), 2000); }
                    catch { setError('Verification failed'); setState('failed'); }
                },
                modal: { ondismiss: () => setState('ready') },
                theme: { color: '#1A1A1A' },
            };
            const razorpay = new window.Razorpay(options);
            razorpay.open();
            razorpay.on('payment.failed', (r: any) => { setError(r.error.description); setState('failed'); });
        } catch (e: any) { setError(e.response?.data?.message || 'Payment failed'); setState('failed'); }
    };

    if (state === 'loading') return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
            <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-accent)' }} />
        </div>
    );

    if (state === 'success') return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--color-bg-primary)' }}>
            <CheckCircle size={72} color="var(--color-success)" />
            <h2 style={{ fontSize: 28, fontFamily: 'var(--font-heading)' }}>Payment Successful!</h2>
            <p className="text-muted">Redirecting to your order...</p>
        </div>
    );

    if (state === 'failed') return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--color-bg-primary)' }}>
            <XCircle size={72} color="var(--color-error)" />
            <h2 style={{ fontSize: 28, fontFamily: 'var(--font-heading)' }}>Payment Failed</h2>
            <p className="text-muted">{error}</p>
            <button onClick={() => { setState('ready'); setError(''); }} className="btn btn-primary mt-lg" style={{ borderRadius: 999 }}>Try Again</button>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--color-bg-primary)' }}>
            <div className="watermark" />
            <div style={{ width: '100%', maxWidth: 420 }}>
                <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: 14 }}>
                    <ArrowLeft size={18} /> Back to cart
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <CreditCard size={32} style={{ color: 'var(--color-accent)' }} />
                    <h1 style={{ fontSize: 32, fontFamily: 'var(--font-heading)' }}>Payment</h1>
                </div>

                <div className="card" style={{ padding: 24, marginBottom: 24, background: 'var(--color-bg-card)' }}>
                    <h3 style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Order #{orderId?.slice(-6)}</h3>

                    {order?.items.map((i: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 15, color: 'var(--color-text-secondary)', borderBottom: idx < order.items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                            <span>{i.quantity}× {i.name}</span>
                            <span style={{ fontWeight: 600 }}>{formatPrice(i.price * i.quantity)}</span>
                        </div>
                    ))}

                    <div style={{ height: 1, background: 'var(--color-border)', margin: '20px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        <span>Total</span>
                        <span>{formatPrice(order?.totalAmount || 0)}</span>
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={state === 'processing'}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', padding: 18, fontSize: 18, borderRadius: 999 }}
                >
                    {state === 'processing' ? (
                        <><Loader2 className="animate-spin" size={20} /> Processing...</>
                    ) : (
                        `Pay ${formatPrice(order?.totalAmount || 0)}`
                    )}
                </button>

                <div style={{ position: 'relative', margin: '20px 0', textAlign: 'center' }}>
                    <div style={{ height: 1, background: 'var(--color-border)', position: 'absolute', top: '50%', left: 0, right: 0 }}></div>
                    <span style={{ background: 'var(--color-bg-primary)', padding: '0 10px', color: 'var(--color-text-muted)', fontSize: 13, position: 'relative' }}>OR</span>
                </div>

                <button
                    onClick={async () => {
                        if (!order || !orderId) return;
                        if (!confirm('Proceed to pay at counter? Your order will be sent to the kitchen immediately.')) return;
                        setState('processing');
                        try {
                            await confirmCashPayment(orderId);
                            setState('success');
                            clearCart();
                            setTimeout(() => navigate(`/order/${orderId}`), 2000);
                        } catch (e: any) {
                            setError(e.response?.data?.message || 'Failed to confirm order');
                            setState('failed');
                        }
                    }}
                    disabled={state === 'processing'}
                    className="btn btn-secondary btn-lg"
                    style={{ width: '100%', padding: 18, fontSize: 16, borderRadius: 999 }}
                >
                    Pay at Counter 💵
                </button>

                <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
                    Secured by Razorpay
                </p>
            </div>
        </div>
    );
}
