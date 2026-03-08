import React from "react";
import Link from "next/link";
import styles from "./PlacesList.module.css";

interface Place {
    id: string;
    name: string;
    category: string;
    rating: number;
    image: string;
}

interface PlacesListProps {
    title: string;
    subtitle: string;
    places: Place[];
    showMichelin?: boolean;
    isCarousel?: boolean;
}

export default function PlacesList({ title, subtitle, places, showMichelin = false, isCarousel = false }: PlacesListProps) {
    return (
        <section className={`${styles.section} ${isCarousel ? styles.carouselSection : ""}`}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2>{title}</h2>
                    <p className={styles.subtitle}>{subtitle}</p>
                </div>

                <div className={isCarousel ? styles.carouselContainer : styles.grid}>
                    {places.map((place) => (
                        <Link key={place.id} href={`/lugares/${place.id}`} className={styles.cardLink}>
                            <article className={styles.card}>
                                <div className={styles.imageWrapper}>
                                    <img
                                        src={place.image}
                                        alt={place.name}
                                        className={styles.image}
                                    />
                                    {showMichelin && (
                                        <div className={styles.michelinBadge}>
                                            <img src="/michelin-star.png" alt="Michelin" className={styles.michelinIcon} />
                                        </div>
                                    )}
                                    <div className={styles.overlay}>
                                        <div className={styles.category}>{place.category}</div>
                                        <h3 className={styles.name}>{place.name}</h3>
                                        <div className={styles.rating}>
                                            <span>★</span> {place.rating.toFixed(1)}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
