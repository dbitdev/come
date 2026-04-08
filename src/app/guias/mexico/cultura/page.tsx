"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Info, Map as MapIcon, Utensils } from 'lucide-react';

export function PlaceholderPage({ title, description }: { title: string, description: string }) {
    return (
        <div style={{ 
            paddingTop: '120px', 
            minHeight: '80vh', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center',
            background: '#f8fafc',
            fontFamily: 'var(--font-outfit), sans-serif'
        }}>
            <div style={{ 
                background: '#fff', 
                padding: '4rem', 
                borderRadius: '32px', 
                boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
                maxWidth: '600px'
            }}>
                <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    background: 'var(--primary)', 
                    color: '#fff', 
                    borderRadius: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 2rem' 
                }}>
                    <Info size={32} />
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>{title}</h1>
                <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                    {description}
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link href="/" style={{ 
                        background: '#000', 
                        color: '#fff', 
                        padding: '0.8rem 1.5rem', 
                        borderRadius: '50px', 
                        fontWeight: 700, 
                        textDecoration: 'none' 
                    }}>
                        Volver al Inicio
                    </Link>
                    <Link href="/lugares" style={{ 
                        background: '#eee', 
                        color: '#000', 
                        padding: '0.8rem 1.5rem', 
                        borderRadius: '50px', 
                        fontWeight: 700, 
                        textDecoration: 'none' 
                    }}>
                        Explorar Mapa
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function CulturaPage() {
    return (
        <PlaceholderPage 
            title="Cultura Mexicana" 
            description="Estamos preparando una sección especial dedicada a la riqueza histórica y cultural de la gastronomía en México. Próximamente."
        />
    );
}
