"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import styles from "./chefs.module.css";

export default function ChefsGuidePage() {
    const [chefs, setChefs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChefs = async () => {
            if (!db) return;
            try {
                const snapshot = await getDocs(collection(db, "chefs"));
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setChefs(data);
            } catch (err) {
                console.error("Error fetching chefs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchChefs();
    }, []);

    if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Cargando guía...</div>;
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <span className={styles.label}>Guía Editorial</span>
                <h1 className={styles.title}>Los Mejores Chefs de México</h1>
                <p className={styles.description}>
                    Un recorrido por el talento, la visión y el legado de quienes transforman 
                    nuestra cultura a través del sabor.
                </p>
            </header>

            <div className={styles.chefsGrid}>
                {chefs.map((chef) => (
                    <div key={chef.id} className={styles.chefCard}>
                        <div className={styles.imageContainer}>
                            <img src={chef.image || "/placeholder-chef.jpg"} alt={chef.nombre} className={styles.chefImage} />
                            <div className={styles.chefOverlay}>
                                {chef.estrellas > 0 && (
                                    <div className={styles.chefAwardBadge}>
                                        {chef.estrellas} ★ Michelin
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={styles.chefInfo}>
                            <h2 className={styles.chefName}>{chef.nombre}</h2>
                            <span className={styles.chefSpecialty}>{chef.ubicacion}</span>
                            <div className={styles.restaurantTag}>
                                <span>Restaurante:</span> {chef.restaurante_principal}
                            </div>
                            <p className={styles.chefBio}>{chef.biografia_corta}</p>
                            
                            {chef.logro_clave && (
                                <div className={styles.awardsList}>
                                    <span className={styles.awardItem}>{chef.logro_clave}</span>
                                </div>
                            )}
                            
                            <div className={styles.chefMeta}>
                                <span className={styles.redes}>{chef.redes}</span>
                            </div>

                            <button className={styles.profileBtn}>Ver Biografía Completa</button>
                        </div>
                    </div>
                ))}
            </div>

            <section className={styles.nominateSection}>
                <div className={styles.nominateContent}>
                    <h2>¿Falta alguien en la lista?</h2>
                    <p>Cada año nominamos a nuevas promesas que están revolucionando la escena culinaria.</p>
                    <button className={styles.nominateBtn}>Nominar un Chef</button>
                </div>
            </section>
        </div>
    );
}
