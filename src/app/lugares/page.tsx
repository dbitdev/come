"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./lugares.module.css";
import { Star, Award, ExternalLink } from "lucide-react";
import { isPublished, rutaLugar } from "@/lib/utils";

const normalizar = (valor: unknown) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const normalizarUbicacion = (valor: unknown) => normalizar(valor).replace(/\b(ciudad de mexico|mexico city)\b/g, "cdmx");

// Metadata cannot be used in a Client Component. Page titles are managed via side effects if needed.

export default function LugaresPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string, location?: string }>;
}) {
    const resolvedSearchParams = use(searchParams);
    const rawQuery = resolvedSearchParams.search || "";
    const rawLocation = resolvedSearchParams.location || "";
    const query = normalizar(rawQuery);
    const location = normalizarUbicacion(rawLocation);
    
    const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const handleCardClick = (restaurant: { id: string; restaurantName?: string; name?: string }) => {
        router.push(rutaLugar(restaurant.restaurantName || restaurant.name, restaurant.id));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                {
                    const response = await fetch("/api/restaurants");
                    const payload = await response.json();
                    if (!response.ok) throw new Error(payload.error || "No se pudo cargar el catálogo.");
                    const firestoreRestaurants = payload.restaurants.filter((data: Record<string, unknown>) => isPublished(data)).map((data: Record<string, any>) => {
                        return {
                            id: data.id,
                            name: data.restaurantName || data.name,
                            category: data.category,
                            address: data.address || "Dirección no disponible",
                            city: data.city || data.ciudad || "",
                            state: data.estado || data.state || "",
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
        const indice = normalizar(`${r.name} ${r.category} ${r.description} ${r.chef} ${r.address} ${r.city} ${r.state}`);
        const indiceUbicacion = normalizarUbicacion(`${r.address} ${r.city} ${r.state}`);
        const matchesSearch = !query || 
            indice.includes(query);
            
        const matchesLocation = !location || 
            indiceUbicacion.includes(location);

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
                <span className="mag-label">Guía de Destinos</span>
                <h1 className="mixed-heading">
                    {query ? (
                        <>Resultados: <span>{query}</span></>
                    ) : (
                        <>Explora <span>Lugares</span></>
                    )}
                </h1>
                <p className={styles.subtitle}>
                    {query 
                        ? `Hemos seleccionado ${filteredRestaurants.length} establecimientos que coinciden con tu búsqueda editorial.` 
                        : "Una curaduría exhaustiva de los mejores rincones gastronómicos de México."}
                </p>
            </header>

            {categories.length > 0 ? (
                categories.map(category => (
                    <section key={category} className={styles.section}>
                        <div className="section-bar">
                            <span>{category}</span>
                            {!query && (
                                <Link href={`/lugares/categoria/${category.toLowerCase()}`} className={styles.viewMore}>
                                    Colección Completa
                                </Link>
                            )}
                        </div>
                        <div className={styles.grid}>
                            {restaurantsByCategory[category].map((restaurant: any) => (
                                <div key={restaurant.id} className={styles.cardWrapper} onClick={() => handleCardClick(restaurant)} style={{ cursor: 'pointer' }}>
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
                                            <div className={styles.cardTop}>
                                                <span className={styles.categoryTag}>{restaurant.category}</span>
                                                {restaurant.isMichelin && <span className="mag-tag">Editorial Pick</span>}
                                            </div>
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
