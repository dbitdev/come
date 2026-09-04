"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Guide } from '@/types/guide';
import Link from 'next/link';
import styles from './GuiasPage.module.css';
import { Plus, MapPin, User } from 'lucide-react';

export default function GuiasPage() {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGuides = async () => {
            if (!db) return;
            try {
                const q = query(collection(db, "guides"), orderBy("createdAt", "desc"), limit(20));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guide));
                setGuides(data);
            } catch (err) {
                console.error("Error fetching guides:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGuides();
    }, []);

    return (
        <div className={styles.container}>
            <header className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroText}>
                        <span className="mag-label">Rutas & Experiencias</span>
                        <h1 className="mixed-heading">Guías <span>Gastronómicas</span></h1>
                        <p>Una colección curada de rutas interactivas diseñadas por expertos para descubrir los secretos culinarios de México.</p>
                    </div>
                    <div className={styles.heroActions}>
                        <Link href="/guias/crear" className={styles.createBtn}>
                            <Plus size={20} /> Crear mi propia ruta
                        </Link>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                <div className="section-bar">
                    <span>Exploraciones Recientes</span>
                    <p className={styles.sectionHeaderHint}>Actualizado hoy</p>
                </div>

                {loading ? (
                    <div className={styles.loader}>Cargando guías...</div>
                ) : (
                    <div className={styles.guidesGrid}>
                        {/* Featured guide, always shown first */}
                        <Link href="/guias/mejores-hamburguesas-cdmx" className={styles.guideCard}>
                            <div className={styles.cardImage}>
                                <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80" alt="Hamburguesas" />
                                <div className={styles.cardBadge}>Destacado</div>
                            </div>
                            <div className={styles.cardBody}>
                                <h3>Las Mejores Hamburguesas de la CDMX</h3>
                                <p>Una ruta épica por los rincones más deliciosos de la capital...</p>
                                <div className={styles.cardMeta}>
                                    <span><MapPin size={14} /> 3 Paradas</span>
                                    <span><User size={14} /> Redacción Come</span>
                                </div>
                            </div>
                        </Link>

                        {/* Firestore Guides */}
                        {guides.map(guide => (
                            <Link key={guide.id} href={`/guias/${guide.slug}`} className={styles.guideCard}>
                                <div className={styles.cardImage}>
                                    <img src={guide.heroImage || "/news-placeholder.jpg"} alt={guide.title} />
                                </div>
                                <div className={styles.cardBody}>
                                    <h3>{guide.title}</h3>
                                    <p>{guide.description ? `${guide.description.substring(0, 100)}...` : ''}</p>
                                    <div className={styles.cardMeta}>
                                        <span><MapPin size={14} /> {guide.stops?.length || 0} Paradas</span>
                                        <span><User size={14} /> {guide.authorName}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && guides.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>Aún no hay rutas de la comunidad. ¡Sé el primero en crear una!</p>
                        <Link href="/guias/crear" className={styles.secondaryBtn}>
                            Crear una Guía
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
