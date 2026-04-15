"use client";

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import styles from './lugar.module.css';
import { FaStore, FaMapMarkerAlt, FaShareAlt, FaAward, FaInstagram, FaTwitter, FaTiktok, FaLink, FaStar } from 'react-icons/fa';

export default function LugarNominationPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isMichelin, setIsMichelin] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        restaurantName: "",
        category: "",
        description: "",
        address: "",
        awards: "",
        instagram: "",
        tiktok: "",
        twitter: "",
        website: "",
        photoUrl: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!db) throw new Error("Firebase not initialized");

            const nominationData = {
                ...formData,
                isMichelin,
                createdAt: serverTimestamp(),
                status: 'pending',
                type: 'restaurant'
            };

            await addDoc(collection(db, "come"), nominationData);
            setSuccess(true);
            setTimeout(() => router.push('/'), 4000);
        } catch (error) {
            console.error("Error nominating place:", error);
            alert("Hubo un error al enviar la nominación. Por favor intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.container} style={{ textAlign: 'center' }}>
                    <div className={styles.formCard}>
                        <div style={{ fontSize: '5rem', color: '#48bb78', marginBottom: '2rem' }}>✨</div>
                        <h2 className={styles.title}>¡Lugar Nominado!</h2>
                        <p className={styles.subtitle}>Gracias por compartir este tesoro gastronómico. Revisaremos la información y lo sumaremos a nuestra exclusiva guía.</p>
                        <button onClick={() => router.push('/')} className={styles.submitBtn} style={{ marginTop: '3rem' }}>Volver al Inicio</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Nomina un Lugar</h1>
                    <p className={styles.subtitle}>¿Conoces un restaurante que deba estar en Néctar? Ayúdanos a descubrir la excelencia culinaria de México.</p>
                </header>

                <form onSubmit={handleSubmit} className={styles.formCard}>
                    {/* Perfil del Establecimiento */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FaStore /> Datos del Restaurante</h2>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label className={styles.label}>Nombre del Restaurante</label>
                                <input required type="text" name="restaurantName" value={formData.restaurantName} onChange={handleInputChange} placeholder="Ej. Pujol / Rosetta" className={styles.input} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Tipo de Cocina</label>
                                <input required type="text" name="category" value={formData.category} onChange={handleInputChange} placeholder="Ej. Mexicana Contemporánea" className={styles.input} />
                            </div>
                            <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                <label className={styles.label}>Reseña o Descripción</label>
                                <textarea required name="description" value={formData.description} onChange={handleInputChange} placeholder="¿Qué hace a este lugar extraordinario?" className={styles.textarea} />
                            </div>
                            <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                <label className={styles.label}>URL de Imagen Representativa</label>
                                <input type="url" name="photoUrl" value={formData.photoUrl} onChange={handleInputChange} placeholder="https://ejemplo.com/interior-restaurante.jpg" className={styles.input} />
                            </div>
                        </div>
                    </section>

                    {/* Ubicación */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FaMapMarkerAlt /> Ubicación</h2>
                        <div className={styles.field}>
                            <label className={styles.label}>Dirección Completa</label>
                            <input required type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Calle, Número, Colonia, Ciudad" className={styles.input} />
                        </div>
                    </section>

                    {/* Reconocimientos */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FaAward /> Reconocimientos</h2>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label className={styles.label}>Premios o Menciones</label>
                                <input type="text" name="awards" value={formData.awards} onChange={handleInputChange} placeholder="Ej. 50 Best, Guía Gourmet..." className={styles.input} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Mención Especial</label>
                                <div className={styles.michelinToggle} onClick={() => setIsMichelin(!isMichelin)}>
                                    <input type="checkbox" checked={isMichelin} readOnly />
                                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        ¿Cuenta con Estrella Michelin? <FaStar style={{ color: isMichelin ? '#e53e3e' : '#ccc' }} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Redes Sociales */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FaShareAlt /> Redes Sociales y Web</h2>
                        <div className={styles.socialGrid}>
                            <div className={styles.socialInputWrapper}>
                                <FaInstagram className={styles.socialIcon} />
                                <input type="text" name="instagram" value={formData.instagram} onChange={handleInputChange} placeholder="Instagram" className={`${styles.input} ${styles.socialInput}`} />
                            </div>
                            <div className={styles.socialInputWrapper}>
                                <FaTiktok className={styles.socialIcon} />
                                <input type="text" name="tiktok" value={formData.tiktok} onChange={handleInputChange} placeholder="TikTok" className={`${styles.input} ${styles.socialInput}`} />
                            </div>
                            <div className={styles.socialInputWrapper}>
                                <FaTwitter className={styles.socialIcon} />
                                <input type="text" name="twitter" value={formData.twitter} onChange={handleInputChange} placeholder="Twitter" className={`${styles.input} ${styles.socialInput}`} />
                            </div>
                            <div className={styles.socialInputWrapper}>
                                <FaLink className={styles.socialIcon} />
                                <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="Sitio Web" className={`${styles.input} ${styles.socialInput}`} />
                            </div>
                        </div>
                    </section>

                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? "Enviando Nominación..." : "Enviar Nominación de Lugar"}
                    </button>
                </form>
            </div>
        </div>
    );
}
