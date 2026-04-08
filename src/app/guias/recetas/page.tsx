"use client";

import React from 'react';
import styles from './Recetas.module.css';
import { Utensils, Clock, User, ChefHat } from 'lucide-react';

const MOCK_RECIPES = [
    {
        id: '1',
        title: 'Mole Madre y Mole Nuevo',
        chef: 'Enrique Olvera',
        time: 'Paciencia infinita',
        difficulty: 'Experto',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80'
    },
    {
        id: '2',
        title: 'Tlayuda Oaxaqueña',
        chef: 'Thalía Barrios',
        time: '45 mins',
        difficulty: 'Intermedio',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80'
    },
    {
        id: '3',
        title: 'Pescado a la Talla',
        chef: 'Gabriela Cámara',
        time: '30 mins',
        difficulty: 'Fácil',
        image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=400&q=80'
    }
];

export default function RecipesPage() {
    return (
        <div className={styles.container}>
            <header className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1>Recetas de los Grandes Maestros</h1>
                    <p>Lleva la alta cocina mexicana a tu mesa con estas recetas exclusivas de nuestros chefs galardonados.</p>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.grid}>
                    {MOCK_RECIPES.map((recipe) => (
                        <article key={recipe.id} className={styles.recipeCard}>
                            <div className={styles.imageWrapper}>
                                <img src={recipe.image} alt={recipe.title} />
                                <div className={styles.difficultyBadge}>{recipe.difficulty}</div>
                            </div>
                            <div className={styles.info}>
                                <h3 className={styles.title}>{recipe.title}</h3>
                                <div className={styles.meta}>
                                    <div className={styles.metaItem}>
                                        <ChefHat size={14} /> <span>{recipe.chef}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <Clock size={14} /> <span>{recipe.time}</span>
                                    </div>
                                </div>
                                <button className={styles.viewBtn}>Ver Receta Completa</button>
                            </div>
                        </article>
                    ))}
                </div>
                
                <div className={styles.comingSoon}>
                    <p>Próximamente: Más de 100 recetas de la Guía Come.</p>
                </div>
            </main>
        </div>
    );
}
