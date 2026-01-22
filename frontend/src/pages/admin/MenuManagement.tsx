import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability } from '../../lib/api';
import { formatPrice } from '../../lib/utils';

interface MenuItem { _id: string; name: string; description: string; category: string; price: number; isAvailable: boolean; tags: string[]; }
interface FormData { name: string; description: string; category: string; price: string; tags: string; }

export default function MenuManagement() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [form, setForm] = useState<FormData>({ name: '', description: '', category: '', price: '', tags: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { getMenu().then((r) => { setItems(r.data); setLoading(false); }); }, []);

    const openModal = (item?: MenuItem) => {
        if (item) { setEditingItem(item); setForm({ name: item.name, description: item.description, category: item.category, price: item.price.toString(), tags: item.tags.join(', ') }); }
        else { setEditingItem(null); setForm({ name: '', description: '', category: '', price: '', tags: '' }); }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const data = { name: form.name, description: form.description, category: form.category, price: parseFloat(form.price), tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
        try {
            if (editingItem) { await updateMenuItem(editingItem._id, data); toast.success('Updated'); }
            else { await createMenuItem(data); toast.success('Created'); }
            setShowModal(false);
            getMenu().then((r) => setItems(r.data));
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleToggle = async (id: string) => { await toggleAvailability(id); setItems((prev) => prev.map((i) => i._id === id ? { ...i, isAvailable: !i.isAvailable } : i)); };
    const handleDelete = async (id: string) => { if (!confirm('Delete this item?')) return; await deleteMenuItem(id); setItems((prev) => prev.filter((i) => i._id !== id)); toast.success('Deleted'); };

    if (loading) return <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} /></div>;

    return (
        <div style={{ padding: 32 }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div><h1 style={{ fontSize: 24, marginBottom: 4 }}>Menu Management</h1><p style={{ color: 'var(--color-text-muted)' }}>{items.length} items</p></div>
                <button onClick={() => openModal()} className="btn btn-primary"><Plus size={18} />Add Item</button>
            </header>
            <div className="result-grid">
                {items.map((item) => (
                    <div key={item._id} className="card animate-scaleIn" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{item.name}</h3>
                                <span className="badge badge-primary">{item.category}</span>
                            </div>
                            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)' }}>{formatPrice(item.price)}</span>
                        </div>

                        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', flex: 1 }}>{item.description}</p>

                        <div className="divider" style={{ margin: '8px 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button onClick={() => handleToggle(item._id)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: item.isAvailable ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                                {item.isAvailable ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                {item.isAvailable ? 'Available' : 'Unavailable'}
                            </button>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => openModal(item)} className="btn btn-secondary btn-sm" style={{ padding: 8 }}><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(item._id)} className="btn btn-secondary btn-sm" style={{ padding: 8, color: 'var(--color-error)', borderColor: 'var(--color-error)' }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 }}>
                    <div style={{ width: '100%', maxWidth: 400, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid var(--color-border)' }}><h2>{editingItem ? 'Edit Item' : 'Add Item'}</h2><button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}><X size={20} /></button></div>
                        <form onSubmit={handleSubmit} style={{ padding: 16 }}>
                            <div style={{ marginBottom: 12 }}><label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ width: '100%', padding: 8, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }} /></div>
                            <div style={{ marginBottom: 12 }}><label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Category *</label><input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required style={{ width: '100%', padding: 8, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }} /></div>
                            <div style={{ marginBottom: 12 }}><label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Price (₹) *</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required style={{ width: '100%', padding: 8, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }} /></div>
                            <div style={{ marginBottom: 12 }}><label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Description</label><input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: 8, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }} /></div>
                            <div style={{ marginBottom: 16 }}><label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Tags (comma separated)</label><input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="veg, spicy" style={{ width: '100%', padding: 8, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }} /></div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}><button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn btn-primary">{saving ? <Loader2 className="animate-spin" size={18} /> : null}{editingItem ? 'Update' : 'Create'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
