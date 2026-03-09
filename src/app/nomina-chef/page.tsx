"use client";

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import styles from './chef.module.css';
import { FaUserAlt, FaBriefcase, FaShareAlt, FaAward, FaInstagram, FaTwitter, FaTiktok, FaLink, FaStar } from 'react-icons/fa';

export default function ChefNominationPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isMichelin, setIsMichelin] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        specialty: "",
        bio: "",
        trajectory: "",
        awards: "",
        instagram: "",
        tiktok: "",
        twitter: "",
        portfolio: "",
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
                status: 'pending'
            };

            await addDoc(collection(db, "chef_nominations"), nominationData);
            setSuccess(true);
            setTimeout(() => router.push('/'), 4000);
        } catch (error) {
            console.error("Error nominating chef:", error);
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
                        <h2 className={styles.title}>¡Nominación Enviada!</h2>
                        <p className={styles.subtitle}>Gracias por ayudarnos a reconocer el talento culinario. Revisaremos la información y nos pondremos en contacto.</p>
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
                    <h1 className={styles.title}>Nomina a un Chef</h1>
                    <p className={styles.subtitle}>Reconocemos el talento, la pasión y la trayectoria de los grandes maestros de la cocina en México.</p>
                </header>

                <form onSubmit={handleSubmit} className={styles.formCard}>
                    {/* Perfil Básico */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FaUserAlt /> Perfil del Chef</h2>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label className={styles.label}>Nombre Completo</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej. Enrique Olvera" className={styles.input} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Especialidad</label>
                                <input required type="text" name="specialty" value={formData.specialty} onChange={handleInputChange} placeholder="Ej. Cocina de Autor / Mexicana" className={styles.input} />
                            </div>
                            <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                <label className={styles.label}>Reseña Biográfica</label>
                                <textarea required name="bio" value={formData.bio} onChange={handleInputChange} placeholder="Una breve descripción que destaque su esencia..." className={styles.textarea} />
                            </div>
                            <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                <label className={styles.label}>URL de Foto de Perfil</label>
                                <input type="url" name="photoUrl" value={formData.photoUrl} onChange={handleInputChange} placeholder="https://ejemplo.com/foto-chef.jpg" className={styles.input} />
                            </div>
                        </div>
                    </section>

                    {/* Trayectoria */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FaBriefcase /> Trayectoria Profesional</h2>
                        <div className={styles.field}>
                            <label className={styles.label}>Experiencia y Logros</label>
                            <textarea required name="trajectory" value={formData.trajectory} onChange={handleInputChange} placeholder="Cuéntanos los hitos más importantes de su carrera, restaurantes donde ha trabajado, etc." className={styles.textarea} style={{ minHeight: '180px' }} />
                        </div>
                    </section>

                    {/* Reconocimientos */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FaAward /> Reconocimientos</h2>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label className={styles.label}>Premios y Galardones</label>
                                <input type="text" name="awards" value={formData.awards} onChange={handleInputChange} placeholder="Ej. James Beard, Mejor Chef de México..." className={styles.input} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Reconocimiento Especial</label>
                                <div className={styles.michelinToggle} onClick={() => setIsMichelin(!isMichelin)}>
                                    <input type="checkbox" checked={isMichelin} readOnly />
                                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        ¿Tiene Estrella Michelin? <FaStar style={{ color: isMichelin ? '#e53e3e' : '#ccc' }} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Redes Sociales */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><FaShareAlt /> Presencia Digital</h2>
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
                                <input type="url" name="portfolio" value={formData.portfolio} onChange={handleInputChange} placeholder="Portafolio o Web" className={`${styles.input} ${styles.socialInput}`} />
                            </div>
                        </div>
                    </section>

                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? "Enviando Nominación..." : "Enviar Nominación de Chef"}
                    </button>
                </form>
            </div>
        </div>
    );
}
