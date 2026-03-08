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
    
    // Menu States
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [currentDish, setCurrentDish] = useState({
        name: "",
        category: "Plato Fuerte",
        price: "",
        description: "",
        ingredients: "",
        image: ""
    });

    const router = useRouter();

    const addDish = () => {
        if (!currentDish.name || !currentDish.price) {
            alert("El nombre y el precio son obligatorios para agregar un platillo.");
            return;
        }
        setMenuItems([...menuItems, { ...currentDish, id: Date.now() }]);
        setCurrentDish({
            name: "",
            category: "Plato Fuerte",
            price: "",
            description: "",
            ingredients: "",
            image: ""
        });
    };

    const removeDish = (id: number) => {
        setMenuItems(menuItems.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else {
            if (menuItems.length === 0) {
                alert("Por favor agrega al menos un platillo a tu menú.");
                return;
            }

            setLoading(true);
            try {
                await addDoc(collection(db, "business_leads"), {
                    restaurantName,
                    category,
                    subdomain: `${subdomain}.come.mx`,
                    email,
                    menu: menuItems,
                    createdAt: serverTimestamp(),
                    status: 'pending'
                });
                setSuccess(true);
                setTimeout(() => router.push('/perfil'), 4000);
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
                                        <button type="submit" style={{ flex: 2, padding: '1rem', background: 'var(--primary)', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>Continuar</button>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Tu Menú Digital</h2>
                                    
                                    {/* Added Dishes List */}
                                    <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {menuItems.map((item) => (
                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
                                                <div>
                                                    <strong style={{ display: 'block' }}>{item.name}</strong>
                                                    <span style={{ fontSize: '0.85rem', color: '#666' }}>{item.category} — ${item.price}</span>
                                                </div>
                                                <button type="button" onClick={() => removeDish(item.id)} style={{ background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                                            </div>
                                        ))}
                                        {menuItems.length === 0 && <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>Aún no has agregado platillos.</p>}
                                    </div>

                                    <div style={{ background: '#fcfcfc', padding: '1.5rem', borderRadius: '12px', border: '2px dashed #ddd', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 700 }}>Nombre del Platillo</label>
                                                <input type="text" value={currentDish.name} onChange={e => setCurrentDish({...currentDish, name: e.target.value})} placeholder="Ej. Mole Poblano" style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd' }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 700 }}>Precio ($)</label>
                                                <input type="number" value={currentDish.price} onChange={e => setCurrentDish({...currentDish, price: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd' }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 700 }}>Categoría</label>
                                                <select value={currentDish.category} onChange={e => setCurrentDish({...currentDish, category: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd' }}>
                                                    <option>Entrada</option>
                                                    <option>Sopa / Ensalada</option>
                                                    <option>Plato Fuerte</option>
                                                    <option>Postre</option>
                                                    <option>Bebida</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 700 }}>Ingredientes</label>
                                                <input type="text" value={currentDish.ingredients} onChange={e => setCurrentDish({...currentDish, ingredients: e.target.value})} placeholder="Chile, cacao, etc." style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd' }} />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 700 }}>Descripción Corta</label>
                                            <textarea value={currentDish.description} onChange={e => setCurrentDish({...currentDish, description: e.target.value})} placeholder="Cuenta de qué trata este platillo..." style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', height: '60px', resize: 'none' }} />
                                        </div>

                                        <button type="button" onClick={addDish} style={{ padding: '0.8rem', background: '#000', color: '#fff', border: 'none', fontWeight: 700, borderRadius: '4px', cursor: 'pointer' }}>+ Agregar Platillo al Menú</button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                        <button type="button" onClick={() => setStep(2)} style={{ flex: 1, padding: '1rem', background: '#eee', color: '#333', fontSize: '1.1rem', fontWeight: 'bold' }}>Atrás</button>
                                        <button type="submit" disabled={loading} style={{ flex: 2, padding: '1rem', background: 'var(--primary)', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', opacity: loading ? 0.7 : 1 }}>
                                            {loading ? 'Sincronizando...' : 'Finalizar Registro'}
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
