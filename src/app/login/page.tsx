"use client";

import React from 'react';
import Link from 'next/link';
import { FaGoogle, FaFacebookF, FaApple, FaEnvelope } from 'react-icons/fa';

export default function LoginPage() {
    const handleSocialLogin = (provider: string) => {
        // Integration with Firebase auth goes here
        console.log(`Log in with ${provider}`);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '2rem', paddingTop: '100px' }}>
            <div style={{ background: '#ffffff', padding: '3.5rem', width: '100%', maxWidth: '450px', border: '1px solid #eaeaea', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '2.2rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Iniciar Sesión</h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        onClick={() => handleSocialLogin('Google')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', background: '#fff', color: '#444', border: '1px solid #ddd', padding: '0.8rem', fontWeight: 600 }}
                    >
                        <FaGoogle color="#DB4437" /> Continuar con Google
                    </button>

                    <button
                        onClick={() => handleSocialLogin('Facebook')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', background: '#1877F2', color: '#fff', padding: '0.8rem', fontWeight: 600 }}
                    >
                        <FaFacebookF /> Continuar con Facebook
                    </button>

                    <button
                        onClick={() => handleSocialLogin('Apple')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', background: '#000', color: '#fff', padding: '0.8rem', fontWeight: 600 }}
                    >
                        <FaApple /> Continuar con Apple
                    </button>
                </div>

                <div style={{ margin: '2rem 0', textAlign: 'center', position: 'relative' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
                    <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 10px', color: '#888', fontSize: '0.9rem' }}>o con email</span>
                </div>

                <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input type="email" placeholder="Correo electrónico" style={{ padding: '0.8rem', border: '1px solid #ddd', width: '100%' }} />
                    <input type="password" placeholder="Contraseña" style={{ padding: '0.8rem', border: '1px solid #ddd', width: '100%' }} />
                    <button type="submit" style={{ padding: '0.8rem', background: 'var(--primary)', color: '#fff', fontWeight: 'bold', marginTop: '1rem' }}>Ingresar</button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                    ¿No tienes cuenta? <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Regístrate</Link>
                </div>
            </div>
        </div>
    );
}
