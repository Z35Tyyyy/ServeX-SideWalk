import React from 'react';

interface LogoProps {
    className?: string;
    style?: React.CSSProperties;
    size?: number | string;
    color?: string;
}

export default function Logo({ className = '', style = {}, size = 32, color = 'black' }: LogoProps) {
    // Calculate font size. If size is a number, assume px.
    const fontSize = typeof size === 'number' ? `${size}px` : size;

    return (
        <div
            className={`logo-text ${className}`}
            style={{
                fontFamily: 'var(--font-brand)',
                color: color,
                fontSize: fontSize,
                lineHeight: 1,
                userSelect: 'none',
                display: 'inline-flex',
                alignItems: 'flex-start',
                ...style
            }}
        >
            <span style={{ fontWeight: 400 }}>Side</span>
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>walk</span>
            <span style={{
                fontSize: '0.4em',
                fontWeight: 400,
                marginLeft: '0.1em',
                marginTop: '0.1em'
            }}>®</span>
        </div>
    );
}
