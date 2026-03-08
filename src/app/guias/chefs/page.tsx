import React from "react";
import { Metadata } from "next";
import { chefsData } from "@/data/mockData";
import styles from "./chefs.module.css";

export const metadata: Metadata = {
    title: "Guía de Chefs - Los Mejores de México | Come",
    description: "Conoce a las mentes brillantes detrás de la gastronomía mexicana. Una selección exclusiva de los chefs más influyentes y premiados de México.",
};

export default function ChefsGuidePage() {
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
                {chefsData.map((chef) => (
                    <div key={chef.id} className={styles.chefCard}>
                        <div className={styles.imageContainer}>
                            <img src={chef.image} alt={chef.name} className={styles.chefImage} />
                            <div className={styles.chefOverlay}>
                                <div className={styles.chefAwardBadge}>
                                    {chef.awards?.[0]}
                                </div>
                            </div>
                        </div>
                        <div className={styles.chefInfo}>
                            <h2 className={styles.chefName}>{chef.name}</h2>
                            <span className={styles.chefSpecialty}>{chef.specialty}</span>
                            <div className={styles.restaurantTag}>
                                <span>Restaurante:</span> {chef.restaurant}
                            </div>
                            <p className={chef.bio}>{chef.bio}</p>
                            
                            {chef.awards && (
                                <div className={styles.awardsList}>
                                    {chef.awards.slice(1).map((award, i) => (
                                        <span key={i} className={styles.awardItem}>{award}</span>
                                    ))}
                                </div>
                            )}
                            
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
