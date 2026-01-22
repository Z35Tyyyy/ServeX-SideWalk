import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, ChefHat, Bell, UtensilsCrossed, Loader2 } from 'lucide-react';
import { getOrder } from '../lib/api';
import { getSocket, connectSocket, joinOrderTracking, leaveOrderTracking } from '../lib/socket';
import { formatPrice, getStatusText, timeAgo } from '../lib/utils';

const steps = [{ status: 'PAID', label: 'Received', icon: CheckCircle }, { status: 'PREPARING', label: 'Preparing', icon: ChefHat }, { status: 'READY', label: 'Ready', icon: Bell }, { status: 'SERVED', label: 'Served', icon: UtensilsCrossed }];

export default function OrderTracking() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (orderId) getOrder(orderId).then((r) => { setOrder(r.data); setLoading(false); }).catch(() => setLoading(false)); }, [orderId]);

    useEffect(() => {
        if (!orderId) return;
        connectSocket();
        const socket = getSocket();
        joinOrderTracking(orderId);
        socket.on('order:statusUpdate', (d: { orderId: string; status: string }) => { if (d.orderId === orderId) setOrder((prev: any) => prev ? { ...prev, status: d.status } : null); });
        return () => { leaveOrderTracking(orderId); socket.off('order:statusUpdate'); };
    }, [orderId]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
            <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-accent)' }} />
        </div>
    );

    if (!order) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>Order not found</p>
        </div>
    );

    const currentIdx = steps.findIndex((s) => s.status === order.status);

    return (
        <div style={{ flex: 1, padding: 24, background: 'var(--color-bg-primary)' }}>
            <div className="watermark" />
            <div style={{ maxWidth: 500, margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontFamily: 'var(--font-heading)' }}>Order #{orderId?.slice(-6)}</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <Clock size={14} /> {timeAgo(order.createdAt)}
                        </p>
                    </div>
                    <span style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: 'var(--color-bg-secondary)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}>
                        {getStatusText(order.status)}
                    </span>
                </header>

                {/* Status Tracker */}
                <div className="card" style={{ padding: 24, marginBottom: 24, background: 'var(--color-bg-card)' }}>
                    <h3 style={{ marginBottom: 24, fontFamily: 'var(--font-heading)', fontSize: 18 }}>Order Status</h3>

                    {order.status === 'PENDING_CASH' ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ width: 64, height: 64, background: '#FFF4E5', color: '#B95000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <span style={{ fontSize: 32 }}>💵</span>
                            </div>
                            <h3 style={{ color: '#B95000', marginBottom: 8, fontSize: 18 }}>Payment Pending</h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>Please proceed to the counter to pay <b>{formatPrice(order.totalAmount)}</b>.</p>
                            <div style={{ fontSize: 13, background: 'var(--color-bg-secondary)', padding: 12, borderRadius: 8, color: 'var(--color-text-muted)' }}>
                                Show Order <b>#{orderId?.slice(-6)}</b> to the cashier
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            {steps.map((step, i) => {
                                const Icon = step.icon;
                                const done = i <= currentIdx;
                                return (
                                    <div key={step.status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                                        <div style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: done ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                            color: done ? 'white' : 'var(--color-text-muted)',
                                            border: done ? 'none' : '2px solid var(--color-border)',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <Icon size={22} />
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: done ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Order Items */}
                <div className="card" style={{ padding: 24, background: 'var(--color-bg-card)' }}>
                    <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-heading)', fontSize: 18 }}>Order Items</h3>
                    {order.items.map((i: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: idx < order.items.length - 1 ? '1px solid var(--color-border)' : 'none', fontSize: 15 }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>{i.quantity}× {i.name}</span>
                            <span style={{ fontWeight: 600 }}>{formatPrice(i.price * i.quantity)}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        <span>Total Paid</span>
                        <span style={{ color: 'var(--color-success)' }}>{formatPrice(order.totalAmount)}</span>
                    </div>
                </div>
                {/* Reorder Button */}
                <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', paddingBottom: 40 }}>
                    <button
                        onClick={() => navigate(`/menu/${typeof order.tableId === 'string' ? order.tableId : order.tableId?._id}`)}
                        className="btn btn-primary btn-lg"
                        style={{ width: 'auto', padding: '12px 32px', borderRadius: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                    >
                        <UtensilsCrossed size={20} /> Browse Menu / Order More
                    </button>
                </div>
            </div>
        </div>
    );
}
