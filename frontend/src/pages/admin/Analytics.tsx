import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Utensils, Loader2 } from 'lucide-react';
import { getAnalytics } from '../../lib/api';
import { formatPrice } from '../../lib/utils';

export default function Analytics() {
    const [summary, setSummary] = useState<{ totalOrders: number; totalRevenue: number; avgOrderValue: number } | null>(null);
    const [topItems, setTopItems] = useState<{ _id: string; name: string; totalQuantity: number; totalRevenue: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { getAnalytics().then((r) => { setSummary(r.data.summary); setTopItems(r.data.topItems); setLoading(false); }); }, []);

    if (loading) return <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} /></div>;

    return (
        <div style={{ padding: 32 }}>
            <header style={{ marginBottom: 32 }}><h1 style={{ fontSize: 24, marginBottom: 4 }}>Analytics</h1><p style={{ color: 'var(--color-text-muted)' }}>Overview of your restaurant performance</p></header>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 24, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)' }}><DollarSign size={24} /></div>
                    <div><p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 4 }}>Total Revenue</p><p style={{ fontSize: 24, fontWeight: 700 }}>{formatPrice(summary?.totalRevenue || 0)}</p></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 24, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--color-primary-light)' }}><ShoppingBag size={24} /></div>
                    <div><p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 4 }}>Total Orders</p><p style={{ fontSize: 24, fontWeight: 700 }}>{summary?.totalOrders || 0}</p></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 24, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--color-warning)' }}><TrendingUp size={24} /></div>
                    <div><p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 4 }}>Avg. Order Value</p><p style={{ fontSize: 24, fontWeight: 700 }}>{formatPrice(summary?.avgOrderValue || 0)}</p></div>
                </div>
            </div>
            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 24 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}><Utensils size={20} />Top Selling Items</h2>
                {topItems.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}><th style={{ padding: '8px 0', textAlign: 'left', fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>#</th><th style={{ padding: '8px 0', textAlign: 'left', fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Item</th><th style={{ padding: '8px 0', textAlign: 'left', fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Qty</th><th style={{ padding: '8px 0', textAlign: 'left', fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Revenue</th></tr></thead>
                        <tbody>{topItems.map((item, i) => <tr key={item._id} style={{ borderBottom: '1px solid var(--color-border)' }}><td style={{ padding: '12px 0' }}><span style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-primary)', color: 'white', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{i + 1}</span></td><td style={{ padding: '12px 0' }}>{item.name}</td><td style={{ padding: '12px 0' }}>{item.totalQuantity}</td><td style={{ padding: '12px 0', fontWeight: 600 }}>{formatPrice(item.totalRevenue)}</td></tr>)}</tbody>
                    </table>
                ) : <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No data available</div>}
            </div>
        </div>
    );
}
