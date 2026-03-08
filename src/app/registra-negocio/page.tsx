"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from 'next/navigation';

export default function RegisterBusinessPage() {
    const [step, setStep] = useState(1);
    const [subdomain, setSubdomain] = useState("");
    const [restaurantName, setRestaurantName] = useState("");
    const [category, setCategory] = useState("Comida Mexicana");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
        } else {
            setLoading(true);
            try {
                await addDoc(collection(db, "business_leads"), {
                    restaurantName,
                    category,
                    subdomain: `${subdomain}.come.mx`,
                    email,
                    createdAt: serverTimestamp(),
                    status: 'pending'
                });
                setSuccess(true);
                setTimeout(() => router.push('/perfil'), 3000);
            } catch (err) {
                console.error("Error saving to Firestore:", err);
                alert("Hubo un error al registrar tu negocio. Por favor intenta de nuevo.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '2rem', paddingTop: '100px' }}>
            <div style={{ background: '#ffffff', padding: '3.5rem', width: '100%', maxWidth: '600px', border: '1px solid #eaeaea', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                {success ? (
                    <div style={{ textAlign: 'center' }}>
                         <div style={{ fontSize: '4rem', color: '#48bb78', marginBottom: '1.5rem' }}>✓</div>
                         <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>¡Registro Recibido!</h2>
                         <p style={{ color: '#666', marginBottom: '2rem' }}>Estamos configurando tu menú en <b>{subdomain}.come.mx</b>. Te redirigiremos a tu perfil en unos segundos.</p>
                         <Link href="/perfil" style={{ color: 'var(--primary)', fontWeight: 700 }}>Ir a mi perfil ahora</Link>
                    </div>
                ) : (
                    <>
                        <h1 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>Únete a Come</h1>
                        <p style={{ textAlign: 'center', color: '#555', marginBottom: '2.5rem', fontSize: '1.1rem', fontWeight: 500 }}>Registra tu negocio y obtén tu menú digital gratis al instante.</p>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {step === 1 && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nombre del Restaurante</label>
                                        <input required type="text" value={restaurantName} placeholder="Ej. Tacos El Pastor" style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc' }} 
                                            onChange={(e) => {
                                                setRestaurantName(e.target.value);
                                                // Autogenerate subdomain suggestion
                                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                                                setSubdomain(val);
                                            }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Categoría</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc' }}>
                                            <option>Comida Mexicana</option>
                                            <option>Mariscos</option>
                                            <option>Antojitos</option>
                                            <option>Alta Cocina</option>
                                            <option>Otro</option>
                                        </select>
                                    </div>
                                    <button type="submit" style={{ padding: '1rem', background: 'var(--primary)', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>Continuar</button>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Subdominio Personalizado</label>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <input required type="text" value={subdomain} onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} style={{ flex: 1, padding: '0.8rem', border: '1px solid #ccc', borderRight: 'none' }} />
                                            <span style={{ padding: '0.8rem', background: '#eee', border: '1px solid #ccc', color: '#666' }}>.come.mx</span>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>Tus clientes verán tu menú en esta dirección.</p>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email de Contacto</label>
                                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc' }} />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '1rem', background: '#eee', color: '#333', fontSize: '1.1rem', fontWeight: 'bold' }}>Atrás</button>
                                        <button type="submit" disabled={loading} style={{ flex: 2, padding: '1rem', background: 'var(--primary)', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', opacity: loading ? 0.7 : 1 }}>
                                            {loading ? 'Registrando...' : 'Crear Menú Digital'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
