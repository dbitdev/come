"use client";

import { useState } from 'react';
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
            // Las nominaciones van a su propia colección: no deben aparecer en
            // el directorio hasta que la redacción las publique en `come`.
            await addDoc(collection(db, "place_nominations"), {
                ...formData,
                isMichelin,
                createdAt: serverTimestamp(),
                status: 'pending'
            });
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
                <div className={styles.successWrapper}>
                    <span className={styles.successIcon}>✦</span>
                    <h2 className={styles.successTitle}>¡Lugar Nominado!</h2>
                    <p className={styles.successText}>
                        Gracias por compartir este tesoro gastronómico. Revisaremos la información y lo sumaremos a nuestra exclusiva guía.
                    </p>
                    <button onClick={() => router.push('/')} className={styles.submitBtn} style={{ maxWidth: '280px' }}>
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            {/* Hero */}
            <div className={styles.heroBanner}>
                <span className={styles.heroLabel}>Forma Parte</span>
                <h1 className={styles.heroTitle}>Nomina un Lugar</h1>
                <p className={styles.heroSubtitle}>
                    ¿Conoces un restaurante que deba estar en Come? Ayúdanos a descubrir la excelencia culinaria de México.
                </p>
            </div>

            {/* Form */}
            <div className={styles.container}>
                <form onSubmit={handleSubmit} className={styles.formCard}>

                    {/* Datos del Restaurante */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FaStore /> Datos del Restaurante</h2>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label className={styles.label}>Nombre del Restaurante *</label>
                                <input required type="text" name="restaurantName" value={formData.restaurantName} onChange={handleInputChange} placeholder="Ej. Pujol / Rosetta" className={styles.input} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Tipo de Cocina *</label>
                                <input required type="text" name="category" value={formData.category} onChange={handleInputChange} placeholder="Ej. Mexicana Contemporánea" className={styles.input} />
                            </div>
                            <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                <label className={styles.label}>Reseña o Descripción *</label>
                                <textarea required name="description" value={formData.description} onChange={handleInputChange} placeholder="¿Qué hace extraordinario a este lugar?" className={styles.textarea} />
                            </div>
                            <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                <label className={styles.label}>URL de Imagen Representativa</label>
                                <input type="url" name="photoUrl" value={formData.photoUrl} onChange={handleInputChange} placeholder="https://ejemplo.com/interior.jpg" className={styles.input} />
                            </div>
                        </div>
                    </section>

                    {/* Ubicación */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FaMapMarkerAlt /> Ubicación</h2>
                        <div className={styles.field}>
                            <label className={styles.label}>Dirección Completa *</label>
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
                                <label className={styles.label}>Estrella Michelin</label>
                                <div className={styles.michelinToggle} onClick={() => setIsMichelin(!isMichelin)}>
                                    <input type="checkbox" checked={isMichelin} readOnly />
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-modern)' }}>
                                        ¿Cuenta con Estrella Michelin?
                                        <FaStar style={{ color: isMichelin ? 'var(--primary)' : 'var(--border-light)' }} />
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
                                <input type="text" name="instagram" value={formData.instagram} onChange={handleInputChange} placeholder="@instagram" className={`${styles.input} ${styles.socialInput}`} />
                            </div>
                            <div className={styles.socialInputWrapper}>
                                <FaTiktok className={styles.socialIcon} />
                                <input type="text" name="tiktok" value={formData.tiktok} onChange={handleInputChange} placeholder="@tiktok" className={`${styles.input} ${styles.socialInput}`} />
                            </div>
                            <div className={styles.socialInputWrapper}>
                                <FaTwitter className={styles.socialIcon} />
                                <input type="text" name="twitter" value={formData.twitter} onChange={handleInputChange} placeholder="@twitter" className={`${styles.input} ${styles.socialInput}`} />
                            </div>
                            <div className={styles.socialInputWrapper}>
                                <FaLink className={styles.socialIcon} />
                                <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="sitio web" className={`${styles.input} ${styles.socialInput}`} />
                            </div>
                        </div>
                    </section>

                    {/* Submit */}
                    <div className={styles.submitSection}>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? "Enviando..." : "✦ Enviar Nominación"}
                        </button>
                        <p className={styles.submitNote}>Tu nominación será revisada por nuestro equipo editorial</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
