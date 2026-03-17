"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./PlacesList.module.css";
import BusinessModal from "./BusinessModal";

interface Place {
    id: string;
    name: string;
    category: string;
    rating: number;
    image: string;
    subdomain?: string;
    isFirebase?: boolean;
}

interface PlacesListProps {
    title: string;
    subtitle: string;
    places: Place[];
    showMichelin?: boolean;
    isCarousel?: boolean;
}

export default function PlacesList({ title, subtitle, places, showMichelin = false, isCarousel = false }: PlacesListProps) {
    const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCardClick = (e: React.MouseEvent, place: any) => {
        e.preventDefault();
        setSelectedBusiness(place);
        setIsModalOpen(true);
    };
    return (
        <section className={`${styles.section} ${isCarousel ? styles.carouselSection : ""}`}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2>{title}</h2>
                    <p className={styles.subtitle}>{subtitle}</p>
                </div>

                <div className={isCarousel ? styles.carouselContainer : styles.grid}>
                    {places.map((place) => (
                        <div key={place.id} onClick={(e) => handleCardClick(e, place)} style={{ cursor: 'pointer' }}>
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
                                            <span>★</span> {typeof place.rating === 'number' ? place.rating.toFixed(1) : (Number(place.rating) ? Number(place.rating).toFixed(1) : place.rating)}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </div>
                    ))}
                </div>
            </div>

            <BusinessModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                business={selectedBusiness} 
            />
        </section>
    );
}
