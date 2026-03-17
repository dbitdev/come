"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaChevronLeft, FaUtensils, FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import styles from './menu.module.css';

export default function DigitalMenuPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMenu = async () => {
            if (!id || !db) return;
            try {
                const docRef = doc(db, "business_leads", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRestaurant({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (err) {
                console.error("Error fetching menu:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, [id]);

    if (loading) return <div className={styles.loading}>Cargando menú digital...</div>;
    if (!restaurant) return <div className={styles.error}>Restaurante no encontrado.</div>;

    const menu = restaurant.menu || [];

    return (
        <div className={styles.menuWrapper}>
            <header className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    <FaChevronLeft /> Volver
                </button>
                <div className={styles.restaurantInfo}>
                    <h1>{restaurant.restaurantName || restaurant.name}</h1>
                    <div className={styles.meta}>
                        <span className={styles.category}>{restaurant.category}</span>
                        <span className={styles.rating}><FaStar /> {restaurant.rating}</span>
                    </div>
                </div>
            </header>

            <main className={styles.content}>
                <section className={styles.hero}>
                    <img src={restaurant.image} alt={restaurant.name} className={styles.heroImage} />
                    <div className={styles.heroOverlay}>
                        <h2>Nuestra Carta</h2>
                        <p>Descubre los sabores que nos definen</p>
                    </div>
                </section>

                <div className={styles.menuGrid}>
                    {menu.length > 0 ? (
                        menu.map((item: any, idx: number) => (
                            <div key={idx} className={styles.dishCard}>
                                {item.image && <img src={item.image} alt={item.name} className={styles.dishImage} />}
                                <div className={styles.dishInfo}>
                                    <div className={styles.dishHeader}>
                                        <h3>{item.name}</h3>
                                        <span className={styles.price}>${item.price}</span>
                                    </div>
                                    <p className={styles.dishDesc}>{item.description}</p>
                                    {item.ingredients && <p className={styles.ingredients}><b>Ingredientes:</b> {item.ingredients}</p>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.noMenu}>
                            <FaUtensils size={48} color="#eee" />
                            <p>El menú digital para este establecimiento aún no ha sido cargado.</p>
                        </div>
                    )}
                </div>
            </main>

            <footer className={styles.footer}>
                <p>{restaurant.address}</p>
                <div className={styles.footerBrand}>Powered by ComeApp</div>
            </footer>
        </div>
    );
}
