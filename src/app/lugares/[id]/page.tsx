"use client";

import React, { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import SinglePlaceMapWrapper from '@/components/SinglePlaceMapWrapper';
import { FaMapMarkerAlt, FaStar, FaUtensils, FaGlobe, FaPhone, FaInstagram, FaFacebook, FaTwitter, FaDirections } from 'react-icons/fa';
import Link from 'next/link';
import styles from './profile.module.css';

export default function RestaurantProfile() {
    const params = useParams();
    const id = params?.id as string;
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRestaurant = async () => {
            if (!id || !db) return;
            try {
                const docRef = doc(db, "business_leads", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRestaurant({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (err) {
                console.error("Error fetching restaurant profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurant();
    }, [id]);

    if (loading) return <div className={styles.loading}>Cargando perfil...</div>;
    if (!restaurant) {
        notFound();
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`;

    return (
        <div className={styles.profileWrapper}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <img src={restaurant.image} alt={restaurant.name} className={styles.heroImage} />
                <div className={styles.heroOverlay} />
            </div>

            <div className={styles.contentContainer}>
                {/* Main Header Card */}
                <header className={styles.mainHeader}>
                    <div className={styles.category}>{restaurant.category}</div>
                    <h1 className={styles.name}>{restaurant.name}</h1>
                    
                    <div className={styles.badges}>
                        <div className={styles.rating}>
                            <FaStar color="#f5c518" /> {restaurant.rating}
                        </div>

                        {restaurant.isMichelin && (
                            <div className={styles.michelinStars}>
                                <img src="/michelin-star.png" alt="Michelin" className={styles.michelinIcon} />
                                <span>{restaurant.michelinStars || 1} Estrellas Michelin</span>
                            </div>
                        )}

                        <div className={styles.addressRow}>
                            <FaMapMarkerAlt color="var(--primary)" />
                            {restaurant.address}
                        </div>
                    </div>
                </header>

                <div className={styles.grid}>
                    {/* Main Content Column */}
                    <main className={styles.aboutSection}>
                        <h2>Experiencia Gastronómica</h2>
                        <p className={styles.description}>
                            {restaurant.description || "Una propuesta culinaria excepcional que redefine los sabores tradicionales con técnicas contemporáneas de vanguardia."}
                        </p>

                        {restaurant.chef && (
                            <section className={styles.chefSection}>
                                <span className={styles.chefLabel}>Liderado por</span>
                                <div className={styles.chefName}>{restaurant.chef}</div>
                                <p style={{ marginTop: '1rem', color: '#666' }}>
                                    Visionario de la cocina {restaurant.category.toLowerCase()}, cuya pasión por los ingredientes locales ha posicionado a {restaurant.name} como un referente internacional.
                                </p>
                            </section>
                        )}

                        {restaurant.signatureDishes && restaurant.signatureDishes.length > 0 && (
                            <section className={styles.signatureSection}>
                                <h3>Platillos Insignia</h3>
                                <div className={styles.dishList}>
                                    {restaurant.signatureDishes.map((dish: string, idx: number) => (
                                        <div key={idx} className={styles.dishItem}>
                                            {dish}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </main>

                    {/* Sidebar Column */}
                    <aside className={styles.sidebar}>
                        <div className={styles.mapCard}>
                            <h3>Ubicación</h3>
                            <div className={styles.mapWrapper}>
                                <SinglePlaceMapWrapper lat={restaurant.lat} lng={restaurant.lng} name={restaurant.name} />
                            </div>
                            
                            <div className={styles.contactInfo}>
                                {restaurant.phone && (
                                    <a href={`tel:${restaurant.phone}`} className={styles.contactLink}>
                                        <FaPhone color="var(--primary)" /> {restaurant.phone}
                                    </a>
                                )}
                                {restaurant.website && (
                                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                                        <FaGlobe color="var(--primary)" /> Web Oficial
                                    </a>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', justifyContent: 'center', fontSize: '1.4rem' }}>
                                {restaurant.socials?.instagram && (
                                    <a href={restaurant.socials.instagram} target="_blank" rel="noreferrer" style={{ color: '#E1306C' }}><FaInstagram /></a>
                                )}
                                {restaurant.socials?.facebook && (
                                    <a href={restaurant.socials.facebook} target="_blank" rel="noreferrer" style={{ color: '#4267B2' }}><FaFacebook /></a>
                                )}
                                {restaurant.socials?.twitter && (
                                    <a href={restaurant.socials.twitter} target="_blank" rel="noreferrer" style={{ color: '#1DA1F2' }}><FaTwitter /></a>
                                )}
                            </div>
                        </div>

                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <button className={styles.actionBtn}>
                                <FaDirections style={{ marginRight: '8px' }} /> Cómo Llegar
                            </button>
                        </a>

                        <Link href={`/lugares/menu/${restaurant.id}`} style={{ textDecoration: 'none' }}>
                            <button className={styles.actionBtn} style={{ background: '#fff', color: '#000', border: '2px solid #000', marginTop: '-1rem' }}>
                                <FaUtensils style={{ marginRight: '8px' }} /> Menú Digital
                            </button>
                        </Link>
                    </aside>
                </div>
            </div>
        </div>
    );
}
