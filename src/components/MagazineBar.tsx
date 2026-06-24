import React from 'react';
import styles from './MagazineBar.module.css';

interface MagazineBarProps {
    title: string;
    variant?: 'orange' | 'black' | 'green' | 'yellow';
    rightText?: string;
}

export default function MagazineBar({ title, variant = 'orange', rightText }: MagazineBarProps) {
    const variantClass = styles[variant] || '';
    
    return (
        <div className={`${styles.bar} ${variantClass}`}>
            <span className={styles.title}>{title}</span>
            {rightText && <span className={styles.right}>{rightText}</span>}
        </div>
    );
}
