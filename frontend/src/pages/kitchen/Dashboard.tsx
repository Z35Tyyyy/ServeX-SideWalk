import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Clock, Bell, CheckCircle, RefreshCw, LogOut, Flame, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getKitchenOrders, updateOrderStatus } from '../../lib/api';
import { getSocket, connectSocket, joinKitchen, leaveKitchen } from '../../lib/socket';
import { useAuthStore } from '../../store/authStore';
import { timeAgo } from '../../lib/utils';
import Footer from '../../components/Footer';

interface Order { _id: string; tableId: { tableNumber: number }; items: { name: string; quantity: number; specialInstructions?: string }[]; status: 'PAID' | 'PREPARING' | 'READY' | 'SERVED'; createdAt: string; }

const statusConfig = {
    PAID: { label: 'New', bg: 'rgba(139, 92, 246, 0.15)', border: 'var(--color-primary)', color: 'var(--color-primary-light)', nextLabel: 'Start Preparing', gradient: 'var(--gradient-primary)' },
    PREPARING: { label: 'Preparing', bg: 'rgba(234, 179, 8, 0.15)', border: 'var(--color-warning)', color: 'var(--color-warning)', nextLabel: 'Mark Ready', gradient: 'var(--gradient-secondary)' },
    READY: { label: 'Ready', bg: 'rgba(34, 197, 94, 0.15)', border: 'var(--color-success)', color: 'var(--color-success)', nextLabel: 'Mark Served', gradient: 'var(--gradient-success)' },
    SERVED: { label: 'Served', bg: 'rgba(34, 197, 94, 0.15)', border: 'var(--color-success)', color: 'var(--color-success)', nextLabel: '', gradient: 'var(--gradient-success)' },
};

export default function KitchenDashboard() {
    const navigate = useNavigate();
    const { token, logout, user } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = () => { setLoading(true); getKitchenOrders().then((r) => { setOrders(r.data); setLoading(false); }); };
    useEffect(() => { fetchOrders(); }, []);

    useEffect(() => {
        if (!token) return;
        connectSocket();
        const socket = getSocket();
        joinKitchen(token);
        socket.on('order:new', (d: { order: Order }) => { setOrders((prev) => [d.order, ...prev]); toast.success(`🔔 New order from Table ${d.order.tableId?.tableNumber}!`); new Audio('/notification.mp3').play().catch(() => { }); });
        socket.on('order:statusUpdate', (d: { orderId: string; status: string }) => { setOrders((prev) => prev.map((o) => o._id === d.orderId ? { ...o, status: d.status as Order['status'] } : o).filter((o) => o.status !== 'SERVED')); });
        return () => { leaveKitchen(); socket.off('order:new'); socket.off('order:statusUpdate'); };
    }, [token]);

    const handleUpdate = async (id: string, status: string) => { await updateOrderStatus(id, status); if (status === 'SERVED') { setOrders((prev) => prev.filter((o) => o._id !== id)); toast.success('✅ Order served!'); } };
    const getNext = (s: string) => ({ PAID: 'PREPARING', PREPARING: 'READY', READY: 'SERVED' }[s]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column' }}>
            <div className="watermark" />
            {/* Background */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--gradient-mesh)', pointerEvents: 'none' }} />

            {/* Header & Stats - Unified Sticky Component */}
            <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--glass-border)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Top Row: Title & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {user?.role === 'admin' && <button onClick={() => navigate('/admin')} className="btn btn-ghost" style={{ padding: 8 }}><ArrowLeft size={20} /></button>}
                        <div className="animate-float" style={{ width: 48, height: 48, background: 'var(--gradient-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow-sm)' }}><ChefHat size={28} color="white" strokeWidth={2} /></div>
                        <div><h1 style={{ fontSize: 24, fontFamily: 'var(--font-brand)', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>Kitchen</h1><p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>Welcome, {user?.name}</p></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={fetchOrders} className="btn btn-secondary" style={{ padding: 10 }}><RefreshCw size={18} /></button>
                        <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-ghost" style={{ padding: '10px 16px' }}><LogOut size={18} /></button>
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8 }}>
                    {[
                        { status: 'PAID', label: 'New', icon: Flame },
                        { status: 'PREPARING', label: 'Cooking', icon: ChefHat },
                        { status: 'READY', label: 'Ready', icon: Bell },
                    ].map(({ status, label, icon: Icon }) => (
                        <div key={status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '8px 4px', background: 'rgba(255,255,255,0.5)', borderRadius: 8, border: '1px solid var(--color-border-light)' }}>
                            <span style={{ fontSize: 20, fontWeight: 800, color: statusConfig[status as keyof typeof statusConfig].color, lineHeight: 1 }}>{orders.filter((o) => o.status === status).length}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                        </div>
                    ))}
                </div>
            </header>

            {/* Orders */}
            <main style={{ padding: 24, position: 'relative', flex: 1 }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 64, color: 'var(--color-text-muted)' }}><ChefHat className="animate-spin" size={48} /></div>
                ) : orders.length === 0 ? (
                    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10vh 64px 64px', textAlign: 'center', flex: 1 }}>
                        <div style={{ background: 'transparent', padding: '48px 64px', borderRadius: 32 }}>
                            <div className="animate-float" style={{ fontSize: 72, marginBottom: 24 }}>🍳</div>
                            <h2 style={{ fontSize: 28, fontFamily: 'var(--font-brand)', fontWeight: 700, marginBottom: 12, color: 'var(--color-primary)' }}>No active orders</h2>
                            <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', fontWeight: 500 }}>New orders will appear here in real-time</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {orders.map((order, idx) => {
                            const config = statusConfig[order.status];
                            return (
                                <div key={order._id} className="animate-scaleIn" style={{ background: 'white', border: `2px solid ${config.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-md)', animationDelay: `${idx * 50}ms` }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: config.bg, borderBottom: `1px solid ${config.border}` }}>
                                        <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-text-primary)' }}>Table {order.tableId?.tableNumber}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}><Clock size={16} />{timeAgo(order.createdAt)}</span>
                                    </div>

                                    {/* Items */}
                                    <div style={{ padding: '16px 20px', maxHeight: 240, overflowY: 'auto' }}>
                                        {order.items.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: i < order.items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                                                <span style={{ fontWeight: 800, color: config.color, minWidth: 28, fontSize: 18 }}>{item.quantity}×</span>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>{item.name}</span>
                                                    {item.specialInstructions && <p style={{ fontSize: 14, fontWeight: 500, color: '#854d0e', background: '#fef9c3', padding: '8px 12px', borderRadius: 8, marginTop: 8, border: '1px solid #fde047' }}>📝 {item.specialInstructions}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)' }}>
                                        <span style={{ padding: '8px 16px', borderRadius: 999, fontSize: 14, fontWeight: 700, background: 'white', color: config.color, border: `1px solid ${config.border}`, boxShadow: 'var(--shadow-sm)' }}>{config.label}</span>
                                        {getNext(order.status) && (
                                            <button onClick={() => handleUpdate(order._id, getNext(order.status)!)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, background: config.gradient, color: 'white', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.1s' }}>
                                                {order.status === 'READY' && <CheckCircle size={18} />}
                                                {config.nextLabel}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
