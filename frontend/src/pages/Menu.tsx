import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Loader2, Search, X, Smile } from 'lucide-react';
import { getMenu, getMenuCategories } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../lib/utils';

interface MenuItem { _id: string; name: string; description: string; category: string; price: number; imageUrl: string; tags: string[]; }

export default function Menu() {
    const { tableId } = useParams<{ tableId: string }>();
    const navigate = useNavigate();
    const { items: cartItems, addItem, updateQuantity, getItemCount, getTotal } = useCartStore();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getMenu(), getMenuCategories()]).then(([m, c]) => { setMenuItems(m.data); setCategories(['All', ...c.data]); setLoading(false); });
    }, []);

    const filteredItems = menuItems.filter((i) =>
        (selectedCategory === 'All' || i.category === selectedCategory) &&
        (searchQuery === '' || i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const getQty = (id: string) => cartItems.find((i) => i.menuItemId === id)?.quantity || 0;

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
            <div style={{ textAlign: 'center' }}>
                <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-accent)' }} />
                <p style={{ marginTop: 16, color: 'var(--color-text-muted)' }}>Loading menu...</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 120 }}>
            <div className="watermark" />
            {/* Header */}
            <header style={{ padding: '20px 16px', background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--color-border)', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>Menu</h1>
                        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{menuItems.length} items available</p>
                    </div>
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '14px 42px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 999, color: 'var(--color-text-primary)', fontSize: 14 }}
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}><X size={18} /></button>}
                </div>
            </header>

            {/* Categories */}
            <div style={{ display: 'flex', gap: 10, padding: '16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {categories.map((c) => (
                    <button
                        key={c}
                        onClick={() => setSelectedCategory(c)}
                        style={{
                            padding: '12px 24px',
                            background: selectedCategory === c ? 'var(--color-primary)' : 'var(--color-bg-card)',
                            color: selectedCategory === c ? 'white' : 'var(--color-text-secondary)',
                            border: selectedCategory === c ? 'none' : '1px solid var(--color-border)',
                            borderRadius: 999,
                            whiteSpace: 'nowrap',
                            fontSize: 14,
                            fontWeight: 600,
                            transition: 'all var(--transition-base)',
                            boxShadow: selectedCategory === c ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                        }}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '0 16px 16px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Smile size={14} /> Sidewalk Specials</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontWeight: 900, fontFamily: 'serif' }}>!!!</span> Spicy</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} /> Veg</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} /> Non-Veg</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#facc15' }} /> Contains Egg</div>
            </div>

            {/* Menu Items */}
            <div style={{ padding: '8px 16px' }}>
                {filteredItems.map((item, idx) => (
                    <div
                        key={item._id}
                        className="card animate-slideUp"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '24px 20px',
                            marginBottom: 16,
                            animationDelay: `${idx * 50}ms`,
                            background: 'var(--color-bg-card)',
                            borderLeft: '4px solid var(--color-primary)', /* Uniform Design Accent */
                            borderRadius: '4px 12px 12px 4px'
                        }}
                    >
                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>{item.name}</h3>
                                    {/* Item Icons */}
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {item.tags.includes('veg') && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', marginTop: 6 }} />}
                                        {item.tags.includes('nonveg') && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', marginTop: 6 }} />}
                                        {item.tags.includes('egg') && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#facc15', marginTop: 6 }} />}
                                        {item.tags.includes('special') && <Smile size={16} style={{ color: 'var(--color-text-primary)' }} />}
                                        {item.tags.includes('spicy') && <span style={{ fontWeight: 900, fontFamily: 'serif', fontSize: 13 }}>!!!</span>}
                                    </div>
                                </div>
                                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>{formatPrice(item.price)}</span>
                            </div>

                            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.6, fontStyle: 'italic' }}>{item.description}</p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div /> {/* Spacer */}

                                {getQty(item._id) === 0 ? (
                                    <button
                                        onClick={() => addItem({ menuItemId: item._id, name: item.name, price: item.price, imageUrl: item.imageUrl })}
                                        style={{
                                            padding: '8px 24px',
                                            background: 'var(--color-primary)',
                                            color: 'var(--color-text-inverse)',
                                            borderRadius: 4,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}
                                    >
                                        Add
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-bg-secondary)', borderRadius: 4, padding: '4px 8px' }}>
                                        <button onClick={() => updateQuantity(item._id, getQty(item._id) - 1)} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)' }}><Minus size={16} /></button>
                                        <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 600 }}>{getQty(item._id)}</span>
                                        <button onClick={() => updateQuantity(item._id, getQty(item._id) + 1)} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)' }}><Plus size={16} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>
                        <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
                        <p>No items found</p>
                    </div>
                )}
            </div>

            {/* Cart Button */}
            {getItemCount() > 0 && (
                <button
                    onClick={() => navigate(`/cart/${tableId}`)}
                    className="animate-slideUp"
                    style={{
                        position: 'fixed',
                        bottom: 24,
                        left: 16,
                        right: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '18px 24px',
                        background: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: 999,
                        fontWeight: 600,
                        boxShadow: 'var(--shadow-xl)',
                        zIndex: 100
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative' }}>
                            <ShoppingCart size={24} />
                            <span style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, background: 'white', color: 'var(--color-primary)', borderRadius: '50%', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getItemCount()}</span>
                        </div>
                        <span>View Cart</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{formatPrice(getTotal())}</span>
                </button>
            )}
        </div>
    );
}
