import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, LayoutGrid, ClipboardList, BarChart3, LogOut, ChefHat, Menu as MenuIcon, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Footer from '../../components/Footer';

import Logo from '../../components/Logo';

const navItems = [
    { path: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
    { path: '/admin/tables', label: 'Tables', icon: LayoutGrid },
    { path: '/admin/orders', label: 'Orders', icon: ClipboardList },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="admin-container">
            <div className="watermark watermark-admin" style={{ display: 'none' }} />
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(!isMobileOpen)}>
                {isMobileOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>

            <aside className={`admin-sidebar ${isMobileOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 32px', color: 'black', fontSize: 20, fontWeight: 700, borderBottom: '1px solid var(--color-border)', justifyContent: 'center' }}>
                    <Logo size={42} />
                </div>

                <nav style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                background: isActive ? 'var(--gradient-primary)' : 'transparent',
                                color: isActive ? 'white' : 'var(--color-text-secondary)',
                                borderRadius: 12, fontWeight: 500
                            })}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ padding: 16, borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={() => navigate('/kitchen')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 16px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                        <ChefHat size={18} />Kitchen View
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--color-bg-tertiary)', borderRadius: 12 }}>
                        <div style={{ width: 36, height: 36, background: 'var(--gradient-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>{user?.name?.charAt(0)}</div>
                        <div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 500 }}>{user?.name}</p><p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{user?.role}</p></div>
                        <button onClick={() => { logout(); navigate('/login'); }} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, color: 'var(--color-text-muted)' }}><LogOut size={18} /></button>
                    </div>
                </div>
            </aside>

            <main className="admin-main">
                <div style={{ flex: 1 }}>
                    <Outlet />
                </div>
                <Footer />
            </main>
        </div>
    );
}
