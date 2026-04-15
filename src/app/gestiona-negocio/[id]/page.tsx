"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import styles from "./gestiona.module.css";
import { FaArrowLeft, FaStore, FaUtensils, FaSave, FaPlus, FaTrash } from "react-icons/fa";

export default function ManageBusinessPage() {
    const { id } = useParams();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [businessData, setBusinessData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form States
    const [formData, setFormData] = useState<any>({
        restaurantName: "",
        category: "",
        address: "",
        phone: "",
        email: "",
        awards: "",
        schedule: "",
    });
    
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [newDish, setNewDish] = useState({
        name: "",
        price: "",
        category: "Plato Fuerte",
        description: "",
        image: ""
    });

    useEffect(() => {
        const fetchBusiness = async () => {
            if (!id || !user) return;

            try {
                if (db) {
                    const docRef = doc(db, "come", id as string);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        
                        // Verify ownership
                        if (data.userId !== user.uid) {
                            alert("No tienes permiso para editar este negocio.");
                            router.push('/perfil');
                            return;
                        }

                        setBusinessData(data);
                        setFormData({
                            restaurantName: data.restaurantName || "",
                            category: data.category || "",
                            address: data.address || "",
                            phone: data.phone || "",
                            email: data.email || "",
                            awards: data.awards || "",
                            schedule: data.schedule || "",
                        });
                        setMenuItems(data.menu || []);
                    } else {
                        alert("Negocio no encontrado.");
                        router.push('/perfil');
                    }
                }
            } catch (error) {
                console.error("Error fetching business:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else {
                fetchBusiness();
            }
        }
    }, [id, user, authLoading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const addDish = () => {
        if (!newDish.name || !newDish.price) {
            alert("Nombre y precio son obligatorios.");
            return;
        }
        setMenuItems([...menuItems, { ...newDish, id: Date.now() }]);
        setNewDish({
            name: "",
            price: "",
            category: "Plato Fuerte",
            description: "",
            image: ""
        });
    };

    const removeDish = (dishId: any) => {
        setMenuItems(menuItems.filter(item => item.id !== dishId));
    };

    const handleSave = async () => {
        if (!id || !db) return;
        setSaving(true);
        try {
            const docRef = doc(db, "come", id as string);
            await updateDoc(docRef, {
                ...formData,
                menu: menuItems,
                updatedAt: new Date().toISOString()
            });
            alert("¡Cambios guardados con éxito!");
        } catch (error) {
            console.error("Error updating business:", error);
            alert("Error al guardar los cambios.");
        } finally {
            setSaving(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.loadingWrapper}>
                    <div className={styles.spinner}></div>
                    <p>Cargando información del negocio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <Link href="/perfil" className={styles.backBtn}>
                            <FaArrowLeft /> Volver a mi perfil
                        </Link>
                        <h1 className={styles.title}>Gestionar Negocio</h1>
                    </div>
                    <button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className={styles.saveBtn}
                    >
                        <FaSave /> {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </header>

                <main>
                    {/* Información General */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FaStore /> Información General</h2>
                        <div className={styles.formGrid}>
                            <div className={styles.field}>
                                <label className={styles.label}>Nombre</label>
                                <input 
                                    className={styles.input} 
                                    name="restaurantName" 
                                    value={formData.restaurantName} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Categoría</label>
                                <select 
                                    className={styles.select} 
                                    name="category" 
                                    value={formData.category} 
                                    onChange={handleInputChange}
                                >
                                    <option>Comida Mexicana</option>
                                    <option>Tacos</option>
                                    <option>Mariscos</option>
                                    <option>Antojitos</option>
                                    <option>Alta Cocina</option>
                                    <option>Otro</option>
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Email Público</label>
                                <input 
                                    className={styles.input} 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Teléfono</label>
                                <input 
                                    className={styles.input} 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                <label className={styles.label}>Dirección</label>
                                <input 
                                    className={styles.input} 
                                    name="address" 
                                    value={formData.address} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Horario</label>
                                <input 
                                    className={styles.input} 
                                    name="schedule" 
                                    value={formData.schedule} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Premios</label>
                                <input 
                                    className={styles.input} 
                                    name="awards" 
                                    value={formData.awards} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                        </div>
                    </section>

                    {/* Menú Digital */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FaUtensils /> Tu Menú Digital</h2>
                        
                        <div className={styles.dishList}>
                            {menuItems.map((item) => (
                                <div key={item.id} className={styles.dishItem}>
                                    <div className={styles.dishInfo}>
                                        <h4>{item.name} — ${item.price}</h4>
                                        <p>{item.category} | {item.description}</p>
                                    </div>
                                    <button onClick={() => removeDish(item.id)} className={styles.deleteBtn}>
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                            {menuItems.length === 0 && <p style={{ color: '#888', fontStyle: 'italic' }}>No hay platillos en el menú.</p>}
                        </div>

                        <div className={styles.addDishBox}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Agregar Nuevo Platillo</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Nombre</label>
                                    <input 
                                        className={styles.input} 
                                        value={newDish.name} 
                                        onChange={e => setNewDish({...newDish, name: e.target.value})} 
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Precio</label>
                                    <input 
                                        className={styles.input} 
                                        type="number" 
                                        value={newDish.price} 
                                        onChange={e => setNewDish({...newDish, price: e.target.value})} 
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Categoría</label>
                                    <select 
                                        className={styles.select} 
                                        value={newDish.category} 
                                        onChange={e => setNewDish({...newDish, category: e.target.value})}
                                    >
                                        <option>Entrada</option>
                                        <option>Sopa / Ensalada</option>
                                        <option>Plato Fuerte</option>
                                        <option>Postre</option>
                                        <option>Bebida</option>
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>URL Imagen</label>
                                    <input 
                                        className={styles.input} 
                                        value={newDish.image} 
                                        onChange={e => setNewDish({...newDish, image: e.target.value})} 
                                    />
                                </div>
                                <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                    <label className={styles.label}>Descripción</label>
                                    <textarea 
                                        className={styles.textarea} 
                                        value={newDish.description} 
                                        onChange={e => setNewDish({...newDish, description: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <button onClick={addDish} className={styles.addDishBtn} style={{ marginTop: '1.5rem' }}>
                                <FaPlus /> Agregar al Menú
                            </button>
                        </div>
                    </section>
                </main>

                <div className={styles.footer}>
                    <button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className={styles.saveBtn}
                    >
                        {saving ? "Guardando..." : "Guardar Cambios Finales"}
                    </button>
                </div>
            </div>
        </div>
    );
}
