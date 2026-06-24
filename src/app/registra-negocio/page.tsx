"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './RegisterBusiness.module.css';
import { useEffect } from 'react';

export default function RegisterBusinessPage() {
    const [step, setStep] = useState(1);
    const [subdomain, setSubdomain] = useState("");
    const [restaurantName, setRestaurantName] = useState("");
    const [category, setCategory] = useState("Comida Mexicana");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [awards, setAwards] = useState("");
    const [schedule, setSchedule] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { user } = useAuth();
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        async function testConnection() {
            if (db) {
                console.log("Testeando conexión con Firestore...");
                try {
                    // Try to read a non-existent doc just to check connectivity
                    await getDoc(doc(db, "_system_test_", "ping"));
                    console.log("Conexión con Firestore: OK");
                } catch (e) {
                    console.error("Error de conexión inicial con Firestore:", e);
                }
            } else {
                console.error("Firestore no está disponible (db is null)");
            }
        }
        testConnection();
    }, []);

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
            setError(null);
            try {
                console.log("Iniciando registro de negocio...");
                console.log("DB instance:", !!db);
                console.log("User authenticated:", !!user, user?.uid);

                if (!db) {
                    throw new Error("Firebase no está inicializado correctamente. Verifica tu conexión o configuración.");
                }

                const docData = {
                    restaurantName,
                    category,
                    subdomain: `${subdomain}.come.mx`,
                    email,
                    phone,
                    address,
                    awards,
                    schedule,
                    menu: menuItems,
                    userId: user?.uid || 'guest',
                    createdAt: serverTimestamp(),
                    status: 'pending'
                };

                console.log("Intentando guardar datos en Firestore:", docData);

                // Timeout of 15 seconds to prevent permanent hang
                const savePromise = addDoc(collection(db, "come"), docData);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("La conexión con el servidor tardó demasiado. Por favor verifica tu internet o intenta más tarde.")), 15000)
                );

                await Promise.race([savePromise, timeoutPromise]);

                console.log("Registro guardado con éxito.");
                setSuccess(true);
                setTimeout(() => router.push('/perfil'), 4000);
            } catch (err: any) {
                console.error("Error saving to Firestore:", err);
                const msg = err.message || "Hubo un error al registrar tu negocio. Por favor intenta de nuevo.";
                setError(msg);
                alert(msg);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', color: '#48bb78', marginBottom: '1.5rem' }}>✓</div>
                        <h2 className={styles['success-title']}>¡Registro Recibido!</h2>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>Estamos configurando tu menú en <b>{subdomain}.come.mx</b>. Te redirigiremos a tu perfil en unos segundos.</p>
                        <Link href="/perfil" style={{ color: 'var(--primary)', fontWeight: 700 }}>Ir a mi perfil ahora</Link>
                    </div>
                ) : (
                    <>
                        <h1 className={styles.title}>Únete a Come</h1>
                        <p className={styles.subtitle}>Registra tu negocio y obtén tu menú digital gratis al instante.</p>

                        {error && (
                            <div style={{ background: '#fff5f5', color: '#e53e3e', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #fed7d7', fontSize: '0.9rem' }}>
                                <strong>Error:</strong> {error}
                                <button type="button" onClick={() => window.location.reload()} style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#e53e3e', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>Reintentar</button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            {step === 1 && (
                                <>
                                    <div className={styles.grid}>
                                        <div>
                                            <label className={styles.label}>Nombre del Restaurante</label>
                                            <input required type="text" value={restaurantName} placeholder="Ej. Tacos El Pastor" className={styles.input} 
                                                onChange={(e) => {
                                                    setRestaurantName(e.target.value);
                                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                                                    setSubdomain(val);
                                                }} />
                                        </div>
                                        <div>
                                            <label className={styles.label}>Categoría</label>
                                            <select value={category} onChange={e => setCategory(e.target.value)} className={styles.select}>
                                                <option>Comida Mexicana</option>
                                                <option>Tacos</option>
                                                <option>Mariscos</option>
                                                <option>Antojitos</option>
                                                <option>Alta Cocina</option>
                                                <option>Otro</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={styles.label}>Dirección Física</label>
                                        <input required type="text" value={address} placeholder="Calle, Número, Colonia, Ciudad" className={styles.input} onChange={e => setAddress(e.target.value)} />
                                    </div>
                                    <div className={styles.grid}>
                                        <div>
                                            <label className={styles.label}>Teléfono</label>
                                            <input required type="tel" value={phone} placeholder="55 1234 5678" className={styles.input} onChange={e => setPhone(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className={styles.label}>Horario</label>
                                            <input type="text" value={schedule} placeholder="Ej. Lun-Dom 9am-10pm" className={styles.input} onChange={e => setSchedule(e.target.value)} />
                                        </div>
                                    </div>
                                    <button type="submit" className={styles['button-primary']}>Continuar</button>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <div className={styles.grid}>
                                        <div>
                                            <label className={styles.label}>Subdominio Personalizado</label>
                                            <div className={styles['subdomain-wrapper']}>
                                                <input required type="text" value={subdomain} onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} className={styles['subdomain-input']} />
                                                <span className={styles['subdomain-suffix']}>.come.mx</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={styles.label}>Email de Contacto</label>
                                            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className={styles.input} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={styles.label}>Premios o Reconocimientos</label>
                                        <textarea value={awards} onChange={e => setAwards(e.target.value)} placeholder="Ej. Mejor Taco de la Ciudad 2023, Guía Michelin, etc." className={styles.textarea} style={{ height: '80px' }} />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="button" onClick={() => setStep(1)} className={`${styles['button-secondary']}`} style={{ flex: 1 }}>Atrás</button>
                                        <button type="submit" className={`${styles['button-primary']}`} style={{ flex: 2 }}>Continuar</button>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Tu Menú Digital</h2>

                                    {/* Added Dishes List */}
                                    <div className={styles['dish-list']}>
                                        {menuItems.map((item) => (
                                            <div key={item.id} className={styles['dish-item']}>
                                                <div>
                                                    <strong style={{ display: 'block' }}>{item.name}</strong>
                                                    <span style={{ fontSize: '0.85rem', color: '#666' }}>{item.category} — ${item.price}</span>
                                                </div>
                                                <button type="button" onClick={() => removeDish(item.id)} style={{ background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                                            </div>
                                        ))}
                                        {menuItems.length === 0 && <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>Aún no has agregado platillos.</p>}
                                    </div>

                                    <div className={styles['dish-form']}>
                                        <div className={styles.grid}>
                                            <div>
                                                <label className={styles.label} style={{ fontSize: '0.85rem' }}>Nombre del Platillo</label>
                                                <input type="text" value={currentDish.name} onChange={e => setCurrentDish({ ...currentDish, name: e.target.value })} placeholder="Ej. Mole Poblano" className={styles.input} />
                                            </div>
                                            <div>
                                                <label className={styles.label} style={{ fontSize: '0.85rem' }}>Precio ($)</label>
                                                <input type="number" value={currentDish.price} onChange={e => setCurrentDish({ ...currentDish, price: e.target.value })} placeholder="0.00" className={styles.input} />
                                            </div>
                                        </div>

                                        <div className={styles.grid}>
                                            <div>
                                                <label className={styles.label} style={{ fontSize: '0.85rem' }}>Categoría</label>
                                                <select value={currentDish.category} onChange={e => setCurrentDish({ ...currentDish, category: e.target.value })} className={styles.select}>
                                                    <option>Entrada</option>
                                                    <option>Sopa / Ensalada</option>
                                                    <option>Plato Fuerte</option>
                                                    <option>Postre</option>
                                                    <option>Bebida</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={styles.label} style={{ fontSize: '0.85rem' }}>Ingredientes</label>
                                                <input type="text" value={currentDish.ingredients} onChange={e => setCurrentDish({ ...currentDish, ingredients: e.target.value })} placeholder="Chile, cacao, etc." className={styles.input} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className={styles.label} style={{ fontSize: '0.85rem' }}>Descripción Corta</label>
                                            <textarea value={currentDish.description} onChange={e => setCurrentDish({ ...currentDish, description: e.target.value })} placeholder="Cuenta de qué trata este platillo..." className={styles.textarea} />
                                        </div>

                                        <div>
                                            <label className={styles.label} style={{ fontSize: '0.85rem' }}>URL de Imagen del Platillo</label>
                                            <input type="url" value={currentDish.image} onChange={e => setCurrentDish({ ...currentDish, image: e.target.value })} placeholder="https://ejemplo.com/imagen.jpg" className={styles.input} />
                                        </div>

                                        <button type="button" onClick={addDish} className={styles['add-dish-btn']}>+ Agregar Platillo al Menú</button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                        <button type="button" onClick={() => setStep(2)} className={`${styles['button-secondary']}`} style={{ flex: 1 }}>Atrás</button>
                                        <button type="submit" disabled={loading} className={`${styles['button-primary']}`} style={{ flex: 2, opacity: loading ? 0.7 : 1 }}>
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
