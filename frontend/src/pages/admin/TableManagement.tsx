import { useEffect, useState } from 'react';
import { Plus, QrCode, Download, Trash2, ToggleLeft, ToggleRight, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTables, createTable, updateTable, deleteTable, regenerateQR } from '../../lib/api';

interface Table { _id: string; tableNumber: number; qrCodeUrl: string; qrCodeData: string; isActive: boolean; capacity: number; }

export default function TableManagement() {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showQR, setShowQR] = useState<Table | null>(null);
    const [tableNumber, setTableNumber] = useState('');
    const [capacity, setCapacity] = useState('4');
    const [saving, setSaving] = useState(false);

    useEffect(() => { getTables().then((r) => { setTables(r.data); setLoading(false); }); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try { await createTable({ tableNumber: parseInt(tableNumber), capacity: parseInt(capacity) }); toast.success('Table created'); setShowModal(false); setTableNumber(''); getTables().then((r) => setTables(r.data)); }
        catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleToggle = async (table: Table) => { await updateTable(table._id, { isActive: !table.isActive }); setTables((prev) => prev.map((t) => t._id === table._id ? { ...t, isActive: !t.isActive } : t)); };
    const handleDelete = async (id: string) => { if (!confirm('Delete this table?')) return; await deleteTable(id); setTables((prev) => prev.filter((t) => t._id !== id)); toast.success('Deleted'); };
    const handleDownload = (table: Table) => { const link = document.createElement('a'); link.href = table.qrCodeUrl; link.download = `Table-${table.tableNumber}-QR.png`; link.click(); };

    if (loading) return <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} /></div>;

    return (
        <div style={{ padding: 32 }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}><div><h1 style={{ fontSize: 24, marginBottom: 4 }}>Table Management</h1><p style={{ color: 'var(--color-text-muted)' }}>{tables.filter((t) => t.isActive).length} active, {tables.filter((t) => !t.isActive).length} inactive</p></div><button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus size={18} />Add Table</button></header>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {tables.map((table) => (
                    <div key={table._id} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 16, opacity: table.isActive ? 1 : 0.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><div style={{ width: 48, height: 48, background: 'var(--gradient-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white' }}>{table.tableNumber}</div><span className={`badge ${table.isActive ? 'badge-success' : 'badge-error'}`}>{table.isActive ? 'Active' : 'Inactive'}</span></div>
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>Capacity: {table.capacity}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setShowQR(table)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-secondary)', fontSize: 14 }}><QrCode size={16} />View QR</button>
                            <button onClick={() => handleDownload(table)} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-secondary)' }}><Download size={16} /></button>
                            <button onClick={() => handleToggle(table)} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', borderRadius: 8, color: table.isActive ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{table.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}</button>
                            <button onClick={() => handleDelete(table._id)} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-error)' }}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 }}>
                    <div style={{ width: '100%', maxWidth: 360, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid var(--color-border)' }}><h2>Add Table</h2><button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}><X size={20} /></button></div>
                        <form onSubmit={handleCreate} style={{ padding: 16 }}>
                            <div style={{ marginBottom: 12 }}><label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Table Number *</label><input type="number" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} min="1" required style={{ width: '100%', padding: 8, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }} /></div>
                            <div style={{ marginBottom: 16 }}><label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Capacity</label><input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="1" style={{ width: '100%', padding: 8, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }} /></div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}><button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn btn-primary">{saving ? <Loader2 className="animate-spin" size={18} /> : null}Create</button></div>
                        </form>
                    </div>
                </div>
            )}
            {showQR && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 }}>
                    <div style={{ width: '100%', maxWidth: 360, background: 'white', border: '1px solid var(--color-border)', borderRadius: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid var(--color-border)' }}><h2>Table {showQR.tableNumber} QR</h2><button onClick={() => setShowQR(null)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}><X size={20} /></button></div>
                        <div style={{ padding: 24, textAlign: 'center' }}><img src={showQR.qrCodeUrl} alt="QR Code" style={{ maxWidth: 200, margin: '0 auto', borderRadius: 8, background: 'white', padding: 16 }} /><p style={{ fontSize: 12, color: 'black', marginTop: 12, wordBreak: 'break-all' }}>{showQR.qrCodeData.replace(/^http:\/\/[^/]+/, 'https://serve-x-side-walk.vercel.app')}</p></div>
                        <div style={{ display: 'flex', gap: 12, padding: 16, borderTop: '1px solid var(--color-border)' }}><button onClick={() => { regenerateQR(showQR._id).then((r) => { setTables((prev) => prev.map((t) => t._id === showQR._id ? { ...t, qrCodeUrl: r.data.qrCodeUrl } : t)); setShowQR({ ...showQR, qrCodeUrl: r.data.qrCodeUrl }); toast.success('Regenerated'); }); }} className="btn btn-secondary" style={{ flex: 1 }}>Regenerate</button><button onClick={() => handleDownload(showQR)} className="btn btn-primary" style={{ flex: 1 }}><Download size={18} />Download</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
