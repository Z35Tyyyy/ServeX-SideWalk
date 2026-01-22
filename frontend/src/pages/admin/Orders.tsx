import { useEffect, useState, useCallback } from 'react';
import { Filter, Eye, Loader2, RefreshCw } from 'lucide-react';
import { getAllOrders, updateOrderStatus } from '../../lib/api';
import { getSocket, connectSocket } from '../../lib/socket';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { formatPrice, formatDate, getStatusColor, getStatusText } from '../../lib/utils';

interface Order { _id: string; tableId: { tableNumber: number } | null; items: { name: string; quantity: number; price: number }[]; totalAmount: number; status: string; createdAt: string; }

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const { token } = useAuthStore();

    const fetchOrders = useCallback(() => {
        setLoading(true);
        getAllOrders({ page, limit: 20, status: statusFilter || undefined })
            .then((r) => { setOrders(r.data.orders); setTotal(r.data.pagination.total); setLoading(false); })
            .catch(() => setLoading(false));
    }, [page, statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Real-time updates
    useEffect(() => {
        if (!token) return;
        connectSocket();
        const socket = getSocket();

        const handleNewOrder = () => {
            toast('🔔 New Order!', { icon: '📦' });
            new Audio('/notification.mp3').play().catch(() => { });
            fetchOrders();
        };

        const handleStatusUpdate = () => {
            fetchOrders();
        };

        socket.on('order:new', handleNewOrder);
        socket.on('order:statusUpdate', handleStatusUpdate);

        return () => {
            socket.off('order:new', handleNewOrder);
            socket.off('order:statusUpdate', handleStatusUpdate);
        };
    }, [token, fetchOrders]);

    if (loading) return <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} /></div>;

    return (
        <div style={{ padding: 32 }}>
            <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: 24, marginBottom: 4 }}>Orders</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>{total} total orders</p>
                </div>
                <button onClick={fetchOrders} className="btn btn-secondary" style={{ width: 40, height: 40, padding: 0, borderRadius: '50%' }} title="Refresh Orders">
                    <RefreshCw size={20} />
                </button>
            </header>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
                <Filter size={18} style={{ color: 'var(--color-text-muted)' }} />
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }}>
                    <option value="">All Statuses</option>
                    <option value="CREATED">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="READY">Ready</option>
                    <option value="SERVED">Served</option>
                    <option value="PENDING_CASH">Pending Cash</option>
                </select>
            </div>
            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: 'var(--color-bg-tertiary)' }}><th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Order</th><th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Table</th><th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total</th><th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</th><th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Date</th><th></th></tr></thead>
                    <tbody>
                        {orders.map((order) => (
                            <>
                                <tr key={order._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: 16 }}><span style={{ fontFamily: 'monospace', color: 'var(--color-primary-light)' }}>#{order._id.slice(-6)}</span></td>
                                    <td style={{ padding: 16 }}>Table {order.tableId?.tableNumber || '?'}</td>
                                    <td style={{ padding: 16, fontWeight: 600 }}>{formatPrice(order.totalAmount)}</td>
                                    <td style={{ padding: 16 }}><span className={`badge ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</span></td>
                                    <td style={{ padding: 16, fontSize: 14, color: 'var(--color-text-muted)' }}>{formatDate(order.createdAt)}</td>
                                    <td style={{ padding: 16 }}><button onClick={() => setExpanded(expanded === order._id ? null : order._id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-secondary)' }}><Eye size={16} /></button></td>
                                </tr>
                                {expanded === order._id && (
                                    <tr><td colSpan={6} style={{ padding: 16, background: 'var(--color-bg-secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h4 style={{ fontSize: 14, marginBottom: 12, color: 'var(--color-text-secondary)' }}>Items</h4>
                                                {order.items.map((i, idx) => <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14, color: 'var(--color-text-secondary)', width: 300 }}><span>{i.quantity}x {i.name}</span><span>{formatPrice(i.price * i.quantity)}</span></div>)}
                                            </div>
                                            {order.status === 'PENDING_CASH' && (
                                                <div style={{ padding: 16, background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: 8, maxWidth: 300 }}>
                                                    <h4 style={{ color: '#856404', fontSize: 16, marginBottom: 8, fontWeight: 700 }}>⚠️ Confirm Cash Payment</h4>
                                                    <p style={{ fontSize: 13, color: '#856404', marginBottom: 12 }}>Customer requested to pay <b>{formatPrice(order.totalAmount)}</b> at counter.</p>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={async () => {
                                                            if (!confirm('Confirm that you have received ' + formatPrice(order.totalAmount) + ' cash?')) return;
                                                            try {
                                                                await updateOrderStatus(order._id, 'PAID');
                                                                // Refresh orders
                                                                const res = await getAllOrders({ page, limit: 20, status: statusFilter || undefined });
                                                                setOrders(res.data.orders);
                                                            } catch (e) { alert('Failed to update'); }
                                                        }}
                                                    >
                                                        Confirm & Mark Paid
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td></tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>No orders found</div>}
            </div>
            {total > 20 && <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}><button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn btn-secondary btn-sm">Previous</button><span style={{ color: 'var(--color-text-muted)', fontSize: 14, display: 'flex', alignItems: 'center' }}>Page {page}</span><button disabled={orders.length < 20} onClick={() => setPage(page + 1)} className="btn btn-secondary btn-sm">Next</button></div>}
        </div>
    );
}
