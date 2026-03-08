import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { restaurantsData } from "@/data/mockData";
import styles from "./lugares.module.css";
import { FaStar } from "react-icons/fa";

export const metadata: Metadata = {
    title: "Explora Restaurantes - Come Guía",
    description: "Encuentra los mejores restaurantes en México. Filtra por categoría y descubre experiencias culinarias únicas.",
};

export default function LugaresPage({
    searchParams,
}: {
    searchParams: { search?: string };
}) {
    const query = searchParams.search?.toLowerCase() || "";
    
    // Filter restaurants based on search query
    const filteredRestaurants = query 
        ? restaurantsData.filter(r => 
            r.name.toLowerCase().includes(query) || 
            r.category.toLowerCase().includes(query) ||
            r.description?.toLowerCase().includes(query)
          )
        : restaurantsData;

    // Group restaurants by category
    const categories = Array.from(new Set(filteredRestaurants.map(r => r.category)));
    
    const restaurantsByCategory = categories.reduce((acc, category) => {
        acc[category] = filteredRestaurants.filter(r => r.category === category);
        // If it's a search result, show all in that category, otherwise slice for overview
        if (!query) {
            acc[category] = acc[category].slice(0, 4);
        }
        return acc;
    }, {} as Record<string, typeof restaurantsData>);

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
                            {restaurantsByCategory[category].map(restaurant => (
                                <Link key={restaurant.id} href={`/lugares/${restaurant.id}`} className={styles.cardLink}>
                                    <div className={styles.card}>
                                        <div className={styles.imageWrapper}>
                                            <img src={restaurant.image} alt={restaurant.name} className={styles.image} />
                                            {restaurant.isMichelin && (
                                                <div className={styles.michelinBadge}>
                                                    <img src="/michelin-star.png" alt="Michelin" className={styles.michelinIcon} />
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.cardContent}>
                                            <h3 className={styles.restaurantName}>{restaurant.name}</h3>
                                            <p className={styles.address}>{restaurant.address}</p>
                                            <div className={styles.rating}>
                                                <FaStar className={styles.starIcon} />
                                                <span>{restaurant.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
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
