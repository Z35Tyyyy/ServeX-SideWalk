import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wifi, Clock, Shield, ChevronRight, Loader2 } from 'lucide-react';
import { getTable } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { setSessionToken } from '../lib/utils';

import Logo from '../components/Logo';

export default function TableLanding() {
    const { tableId } = useParams<{ tableId: string }>();
    const navigate = useNavigate();
    const setTableId = useCartStore((s) => s.setTableId);
    const [table, setTable] = useState<{ tableNumber: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!tableId) { setError('Invalid table'); setLoading(false); return; }
        getTable(tableId)
            .then((r) => {
                setTable(r.data);
                setTableId(tableId);
                if (r.data.sessionToken) {
                    setSessionToken(tableId, r.data.sessionToken);
                }
                setLoading(false);
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Table not found');
                setLoading(false);
            });
    }, [tableId, setTableId]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ margin: '0 auto 24px', display: 'flex', justifyContent: 'center' }}>
                    <Logo size={64} />
                </div>
                <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-accent)' }} />
            </div>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--color-bg-primary)' }}>
            <div style={{ fontSize: 64 }}>☕</div>
            <h2 style={{ fontSize: 24, fontFamily: 'var(--font-heading)' }}>{error}</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>Please scan a valid QR code</p>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--color-bg-primary)' }}>
            <div className="watermark" />
            {/* Decorative warm gradient orbs */}
            <div style={{ position: 'fixed', top: '-30%', right: '-20%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(196, 164, 132, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-20%', left: '-15%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(139, 115, 85, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div className="animate-fadeIn" style={{ textAlign: 'center', maxWidth: 420, position: 'relative' }}>
                {/* Coffee Icon */}
                {/* Coffee Icon */}
                <div className="animate-float" style={{ margin: '0 auto 32px', display: 'flex', justifyContent: 'center' }}>
                    <Logo size={80} />
                </div>

                {/* Brand */}
                {/* Brand */}
                <div style={{ marginBottom: 8 }}></div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 32, fontSize: 'clamp(14px, 4vw, 18px)' }}>Where Great Food Meets Great Service</p>

                {/* Table Card */}
                <div className="card" style={{ padding: 28, marginBottom: 32, background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>You're seated at</span>
                    </div>
                    <div style={{ fontSize: 'clamp(48px, 12vw, 64px)', fontWeight: 700, lineHeight: 1, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>
                        Table {table?.tableNumber}
                    </div>
                </div>

                {/* Features */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
                    {[
                        { icon: Wifi, label: 'Instant' },
                        { icon: Clock, label: 'Fast' },
                        { icon: Shield, label: 'Secure' },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} style={{ padding: 16, background: 'white', border: '1px solid var(--color-border)', borderRadius: 16, textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                            <Icon size={24} style={{ color: 'var(--color-accent)', marginBottom: 8 }} />
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* CTA Button */}
                <button
                    onClick={() => navigate(`/menu/${tableId}`)}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', padding: '18px 32px', fontSize: 18, borderRadius: 999 }}
                >
                    <span>View Menu</span>
                    <ChevronRight size={24} />
                </button>

                <p style={{ marginTop: 20, fontSize: 13, color: 'var(--color-text-muted)', letterSpacing: 1 }}>
                    BROWSE • ORDER • PAY • ENJOY
                </p>
            </div>
        </div>
    );
}
