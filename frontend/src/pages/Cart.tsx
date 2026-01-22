import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, Loader2, Receipt, ShoppingBag, ChevronRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { createOrder } from '../lib/api';
import { formatPrice, getSessionToken, clearSessionToken } from '../lib/utils';

export default function Cart() {
    const { tableId } = useParams<{ tableId: string }>();
    const navigate = useNavigate();
    const { items, updateQuantity, removeItem, getSubtotal, getSGST, getCGST, getTotal, checkExpiry } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expired, setExpired] = useState(false);

    // Check cart expiry on mount and periodically
    useEffect(() => {
        const wasExpired = checkExpiry();
        if (wasExpired) {
            setExpired(true);
            if (tableId) clearSessionToken(tableId);
            toast.error('Your session expired due to inactivity');
        }

        const interval = setInterval(() => {
            if (checkExpiry()) {
                setExpired(true);
                if (tableId) clearSessionToken(tableId);
                toast.error('Your session expired due to inactivity');
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [checkExpiry, tableId]);

    const handleCheckout = async () => {
        if (!tableId || items.length === 0) return;

        const sessionToken = getSessionToken(tableId);
        if (!sessionToken) {
            setError('Session expired. Please scan the QR code again.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await createOrder({
                tableId,
                items: items.map((i) => ({
                    menuItemId: i.menuItemId,
                    quantity: i.quantity,
                    specialInstructions: i.specialInstructions
                })),
                sessionToken,
            });
            navigate(`/payment/${res.data.order._id}`);
        } catch (e: any) {
            const msg = e.response?.data?.message || 'Failed to create order';
            const pendingOrderId = e.response?.data?.orderId;

            // If there's a pending order, navigate to its payment page
            if (pendingOrderId) {
                toast.error('Redirecting to your pending payment...');
                navigate(`/payment/${pendingOrderId}`);
                return;
            }

            setError(msg);
            toast.error(msg);

            if (e.response?.status === 401) {
                setTimeout(() => navigate(`/t/${tableId}`), 2000);
            }
            setLoading(false);
        }
    };

    // Show expired session screen
    if (expired || items.length === 0) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--color-bg-primary)' }}>
            <div className="animate-float" style={{ fontSize: 80, marginBottom: 24 }}>{expired ? '⏰' : '🛒'}</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-heading)' }}>{expired ? 'Session Expired' : 'Your cart is empty'}</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>{expired ? 'Your cart was cleared due to inactivity' : 'Add some delicious items!'}</p>
            <button onClick={() => navigate(`/t/${tableId}`)} className="btn btn-primary btn-lg" style={{ borderRadius: 999 }}>
                <ShoppingBag size={20} /> {expired ? 'Scan QR Again' : 'Browse Menu'}
            </button>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 100, background: 'var(--color-bg-primary)' }}>
            <div className="watermark" />
            <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 16px', background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100 }}>
                <button onClick={() => navigate(`/menu/${tableId}`)} className="btn btn-secondary" style={{ padding: 12, borderRadius: 12 }}><ArrowLeft size={20} /></button>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Your Cart</h1>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{items.length} items</p>
                </div>
            </header>

            <div style={{ padding: 16 }}>
                {/* Error Message */}
                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(184, 84, 80, 0.08)', border: '1px solid var(--color-error)', borderRadius: 12, marginBottom: 16, color: 'var(--color-error)' }}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {items.map((item, idx) => (
                    <div key={item.menuItemId} className="card animate-slideUp" style={{ display: 'flex', gap: 16, padding: 16, marginBottom: 12, animationDelay: `${idx * 50}ms`, background: 'var(--color-bg-card)' }}>
                        <div style={{ width: 70, height: 70, background: 'var(--color-bg-secondary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerText = '🍽️';
                                    }}
                                />
                            ) : '🍽️'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-heading)' }}>{item.name}</h3>
                            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>{formatPrice(item.price * item.quantity)}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--color-bg-secondary)', borderRadius: 999, padding: 4 }}>
                                <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary)', color: 'white', borderRadius: 999 }}><Minus size={16} /></button>
                                <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary)', color: 'white', borderRadius: 999 }}><Plus size={16} /></button>
                            </div>
                            <button onClick={() => removeItem(item.menuItemId)} style={{ color: 'var(--color-error)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={14} /> Remove</button>
                        </div>
                    </div>
                ))}

                <div className="card" style={{ padding: 24, marginTop: 24, background: 'var(--color-bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <Receipt size={20} style={{ color: 'var(--color-accent)' }} />
                        <h3 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Bill Summary</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: 'var(--color-text-secondary)' }}><span>Subtotal</span><span>{formatPrice(getSubtotal())}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: 'var(--color-text-secondary)' }}><span>SGST (2.5%)</span><span>{formatPrice(getSGST())}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: 'var(--color-text-secondary)' }}><span>CGST (2.5%)</span><span>{formatPrice(getCGST())}</span></div>
                    </div>

                    <div className="divider" />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Total</span>
                        <span style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{formatPrice(getTotal())}</span>
                    </div>
                </div>
            </div>

            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 16, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'var(--glass-blur)', borderTop: '1px solid var(--color-border)' }}>
                <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', padding: 18, borderRadius: 999 }}
                >
                    {loading ? (
                        <><Loader2 className="animate-spin" size={20} /> Processing...</>
                    ) : (
                        <>Proceed to Payment <ChevronRight size={20} /></>
                    )}
                </button>
            </div>
        </div>
    );
}
