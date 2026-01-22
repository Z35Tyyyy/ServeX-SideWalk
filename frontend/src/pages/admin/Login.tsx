import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import Footer from '../../components/Footer';

export default function Login() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) { toast.error('Please fill all fields'); return; }
        setLoading(true);
        try {
            const { data } = await login(email, password);
            setAuth(data.user, data.token);
            toast.success(`Welcome back, ${data.user.name}!`, { icon: '👋' });
            navigate(data.user.role === 'admin' ? '/admin' : '/kitchen');
        } catch (e: any) { toast.error(e.response?.data?.message || 'Invalid credentials'); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div className="watermark" />
            {/* Background Effects */}
            <div style={{ position: 'fixed', top: '-30%', right: '-20%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div className="animate-scaleIn" style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
                {/* Card */}
                <div className="card" style={{ padding: '20px 24px' }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <div className="animate-float" style={{ width: 280, margin: '0 auto 0' }}>
                            <img src="/logo-removebg-preview.png" alt="Side Walk" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>Staff Dashboard</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="input"
                                    style={{ paddingLeft: 38, paddingTop: 8, paddingBottom: 8, fontSize: 14 }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="input"
                                    style={{ paddingLeft: 38, paddingTop: 8, paddingBottom: 8, fontSize: 14 }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', padding: 10, fontSize: 14 }}
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin" size={20} />Signing in...</>
                            ) : (
                                <>Sign In<ArrowRight size={20} /></>
                            )}
                        </button>
                    </form>
                </div>

                {/* Demo Credentials */}
                <div className="card" style={{ marginTop: 8, padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Sparkles size={16} style={{ color: 'var(--color-warning)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Demo Credentials</span>
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Admin</span>
                            <span style={{ color: 'var(--color-primary-light)', fontFamily: 'monospace' }}>admin@sidewalk.com / admin123</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Kitchen</span>
                            <span style={{ color: 'var(--color-primary-light)', fontFamily: 'monospace' }}>kitchen@sidewalk.com / kitchen123</span>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
                <Footer />
            </div>
        </div >
    );
}
