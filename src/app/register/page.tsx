"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaGoogle, FaEnvelope, FaUserPlus } from 'react-icons/fa';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from '@/lib/firebase';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            router.push('/admin'); // Redirect to admin after registration
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("El correo ya está registrado.");
            } else if (err.code === 'auth/weak-password') {
                setError("La contraseña es muy débil (mínimo 6 caracteres).");
            } else {
                setError("Error al crear la cuenta. Inténtalo de nuevo.");
            }
        }
    };

    const handleGoogleRegister = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push('/admin');
        } catch (err: any) {
            console.error(err);
            setError("Error al registrarse con Google.");
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '2rem', paddingTop: '100px' }}>
            <div style={{ background: '#ffffff', padding: '3.5rem', width: '100%', maxWidth: '450px', border: '1px solid #eaeaea', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2.2rem', fontWeight: 800, color: 'var(--foreground)' }}>Crear Cuenta</h1>
                
                {error && (
                    <div style={{ padding: '0.8rem', backgroundColor: '#fff5f5', color: '#e53e3e', marginBottom: '1.5rem', borderRadius: '4px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleRegister}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', width: '100%', background: '#fff', color: '#444', border: '1px solid #ddd', padding: '0.8rem', fontWeight: 600, marginBottom: '2rem' }}
                >
                    <FaGoogle color="#DB4437" /> Registrarse con Google
                </button>

                <div style={{ margin: '2rem 0', textAlign: 'center', position: 'relative' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
                    <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 10px', color: '#888', fontSize: '0.9rem' }}>o con email</span>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input 
                        type="text" 
                        placeholder="Nombre completo" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ padding: '0.8rem', border: '1px solid #ddd' }} 
                    />
                    <input 
                        type="email" 
                        placeholder="Correo electrónico" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '0.8rem', border: '1px solid #ddd' }} 
                    />
                    <input 
                        type="password" 
                        placeholder="Contraseña" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '0.8rem', border: '1px solid #ddd' }} 
                    />
                    <button type="submit" style={{ padding: '0.8rem', background: 'var(--primary)', color: '#fff', fontWeight: 'bold', marginTop: '1rem' }}>Crear Cuenta</button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                    ¿Ya tienes cuenta? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Inicia Sesión</Link>
                </div>
            </div>
        </div>
    );
}
