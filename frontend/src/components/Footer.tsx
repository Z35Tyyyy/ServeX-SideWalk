import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '24px',
            color: 'var(--color-text-muted)',
            fontSize: 13,
            marginTop: 'auto',
            width: '100%',
            backgroundColor: 'var(--color-bg-secondary)',
            borderTop: '1px solid var(--color-border-light)',
            letterSpacing: '0.05em'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 400, fontFamily: 'var(--font-brand)', fontSize: 16, letterSpacing: '0em', color: 'var(--color-primary)' }}>Side<span style={{ fontStyle: 'italic', fontWeight: 400 }}>walk</span></span>
                <span>&copy; {new Date().getFullYear()}</span>
                <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                <span>Neighborhood Café</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.8 }}>
                <span>Made with</span>
                <Heart size={12} style={{ fill: 'var(--color-primary)', color: 'var(--color-primary)' }} />
                <span>by <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Z35Tyyyy</span></span>
            </div>
        </div>
    );
}
