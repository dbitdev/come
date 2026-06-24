"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaGoogle, FaFacebookF, FaApple, FaEnvelope } from 'react-icons/fa';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from '@/lib/firebase';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const { signInWithEmailAndPassword } = await import("firebase/auth");
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/admin'); // Redirect to admin after login
        } catch (err: any) {
            console.error("Login error:", err.code, err.message);
            if (err.code === 'auth/user-not-found') {
                setError("El usuario no existe. Por favor regístrate.");
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError("Correo o contraseña incorrectos.");
            } else if (err.code === 'auth/invalid-api-key') {
                setError("Error de configuración: API key inválida.");
            } else if (err.code === 'auth/network-request-failed') {
                setError("Error de red. Verifica tu conexión a internet.");
            } else if (err.code === 'auth/too-many-requests') {
                setError("Demasiados intentos. Intenta más tarde.");
            } else {
                setError(`Error al iniciar sesión (${err.code || 'unknown'}). Verifica tus credenciales.`);
            }
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push('/admin');
        } catch (err: any) {
            console.error(err);
            setError("Error al iniciar sesión con Google. Inténtalo de nuevo.");
        }
    };

    const handleSocialLogin = (provider: string) => {
        if (provider === 'Google') {
            handleGoogleLogin();
        } else {
            console.log(`Log in with ${provider} (Not implemented)`);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '2rem', paddingTop: '100px' }}>
            <div style={{ background: '#ffffff', padding: '3.5rem', width: '100%', maxWidth: '450px', border: '1px solid #eaeaea', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '2.2rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Iniciar Sesión</h1>

                {error && (
                    <div style={{ padding: '0.8rem', backgroundColor: '#fff5f5', color: '#e53e3e', marginBottom: '1.5rem', borderRadius: '4px', fontSize: '0.9rem', textAlign: 'center', border: '1px solid #fed7d7' }}>
                        {error}
                    </div>
                )}

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

                <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input 
                        type="email" 
                        placeholder="Correo electrónico" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '0.8rem', border: '1px solid #ddd', width: '100%' }} 
                    />
                    <input 
                        type="password" 
                        placeholder="Contraseña" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '0.8rem', border: '1px solid #ddd', width: '100%' }} 
                    />
                    <button type="submit" style={{ padding: '0.8rem', background: 'var(--primary)', color: '#fff', fontWeight: 'bold', marginTop: '1rem' }}>Ingresar</button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                    ¿No tienes cuenta? <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Regístrate</Link>
                </div>
            </div>
        </div>
    );
}
