"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./lugares.module.css";
import { Star, Award, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// Metadata cannot be used in a Client Component. Page titles are managed via side effects if needed.

export default function LugaresPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string, location?: string }>;
}) {
    const resolvedSearchParams = use(searchParams);
    const rawQuery = resolvedSearchParams.search || "";
    const rawLocation = resolvedSearchParams.location || "";
    const query = rawQuery.toLowerCase();
    const location = rawLocation.toLowerCase();
    
    const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const handleCardClick = (id: string) => {
        router.push(`/lugares/${id}`);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (db) {
                    const querySnapshot = await getDocs(collection(db, "business_leads"));
                    const firestoreRestaurants = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            name: data.restaurantName || data.name,
                            category: data.category,
                            address: data.address || "Dirección no disponible",
                            image: (data.menu && data.menu[0]?.image) || data.image || "/placeholder-restaurant.jpg",
                            rating: data.rating || "Nuevo",
                            isMichelin: !!data.awards || !!data.isMichelin,
                            michelinStars: data.michelinStars || 0,
                            awards: data.awards,
                            subdomain: data.subdomain,
                            chef: data.chef,
                            description: data.description,
                            signatureDishes: data.signatureDishes,
                            isFirebase: true
                        };
                    });
                    setAllRestaurants(firestoreRestaurants);
                } else {
                    setAllRestaurants([]);
                }
            } catch (error) {
                console.error("Error fetching places:", error);
                setAllRestaurants([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredRestaurants = allRestaurants.filter(r => {
        const matchesSearch = !query || 
            r.name.toLowerCase().includes(query) || 
            r.category.toLowerCase().includes(query) ||
            (r.description && r.description.toLowerCase().includes(query));
            
        const matchesLocation = !location || 
            (r.address && r.address.toLowerCase().includes(location)) ||
            (r.name && r.name.toLowerCase().includes(location));

        return matchesSearch && matchesLocation;
    });

    const categories = Array.from(new Set(filteredRestaurants.map(r => r.category)));
    
    const restaurantsByCategory = categories.reduce((acc, category) => {
        acc[category] = filteredRestaurants.filter(r => r.category === category);
        if (!query) {
            acc[category] = acc[category].slice(0, 4);
        }
        return acc;
    }, {} as Record<string, any[]>);

    if (loading) {
        return (
            <div className={styles.loadingWrapper}>
                <div className={styles.spinner}></div>
                <p>Descubriendo los mejores lugares...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    {query ? `Resultados para "${query}"` : "Explora Lugares"}
                </h1>
                <p className={styles.subtitle}>
                    {query 
                        ? `Hemos encontrado ${filteredRestaurants.length} lugares para ti.` 
                        : "Descubre lo mejor de la gastronomía organizado para ti"}
                </p>
            </header>

            {categories.length > 0 ? (
                categories.map(category => (
                    <section key={category} className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.categoryTitle}>{category}</h2>
                            {!query && (
                                <Link href={`/lugares/categoria/${category.toLowerCase()}`} className={styles.viewMore}>
                                    Ver todos
                                </Link>
                            )}
                        </div>
                        <div className={styles.grid}>
                            {restaurantsByCategory[category].map((restaurant: any) => (
                                <div key={restaurant.id} className={styles.cardWrapper} onClick={() => handleCardClick(restaurant.id)} style={{ cursor: 'pointer' }}>
                                    <div className={styles.card}>
                                        <div className={styles.imageWrapper}>
                                            <img src={restaurant.image} alt={restaurant.name} className={styles.image} />
                                            {restaurant.isMichelin && (
                                                <div className={styles.michelinBadge}>
                                                    {restaurant.isFirebase ? <Award size={18} /> : <img src="/michelin-star.png" alt="Michelin" className={styles.michelinIcon} />}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.cardContent}>
                                            <h3 className={styles.restaurantName}>{restaurant.name}</h3>
                                            <p className={styles.address}>{restaurant.address}</p>
                                            <div className={styles.cardFooter}>
                                                <div className={styles.rating}>
                                                    <Star className={styles.starIcon} size={14} fill="currentColor" />
                                                    <span>{restaurant.rating}</span>
                                                </div>
                                                {restaurant.isFirebase && (
                                                    <span className={styles.digitalMenuHint}>
                                                        <ExternalLink size={14} /> Info y Menú
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))
            ) : (
                <div className={styles.noResults}>
                    <p>No se encontraron resultados para su búsqueda. Intente con otros términos.</p>
                    <Link href="/lugares" className={styles.resetSearch}>Ver todos los lugares</Link>
                </div>
            )}
        </div>
    );
}
