"use client";

import React, { useState } from 'react';
import styles from './ChefsPage.module.css';
import Link from 'next/link';
import { Award, Utensils, Star, Search, ChevronRight } from 'lucide-react';

const MOCK_CHEFS = [
    {
        id: 'alfonso-cadena',
        name: 'Alfonso Cadena',
        restaurant: 'Hueso / Carbón',
        image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
        specialty: 'Cocina de Autor',
        stars: 1,
    },
    {
        id: 'elena-reygadas',
        name: 'Elena Reygadas',
        restaurant: 'Rosetta',
        image: 'https://images.unsplash.com/photo-1583394838336-acd977730f8a?auto=format&fit=crop&w=400&q=80',
        specialty: 'Panadería / Contemporánea',
        stars: 1,
    },
    {
        id: 'enrique-olvera',
        name: 'Enrique Olvera',
        restaurant: 'Pujol',
        image: 'https://images.unsplash.com/photo-1595273670150-db0a3d39074f?auto=format&fit=crop&w=400&q=80',
        specialty: 'Alta Cocina Mexicana',
        stars: 2,
    },
    {
        id: 'daniela-soto-innes',
        name: 'Daniela Soto-Innes',
        restaurant: 'Cosme (NY)',
        image: 'https://images.unsplash.com/photo-1605522455879-0520448106a7?auto=format&fit=crop&w=400&q=80',
        specialty: 'Contemporánea',
        stars: 0,
    },
    {
        id: 'jorge-vallejo',
        name: 'Jorge Vallejo',
        restaurant: 'Quintonil',
        image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=400&q=80',
        specialty: 'Ingrediente Local',
        stars: 2,
    },
    {
        id: 'gabriela-camara',
        name: 'Gabriela Cámara',
        restaurant: 'Contramar',
        image: 'https://images.unsplash.com/photo-1560697529-7236591c0066?auto=format&fit=crop&w=400&q=80',
        specialty: 'Pescados y Mariscos',
    },
];

export default function ChefsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredChefs = MOCK_CHEFS.filter(chef => 
        chef.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chef.restaurant.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <header className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1>Maestros de la Cocina</h1>
                    <p>Descubre a los visionarios que están redefiniendo el panorama gastronómico de México.</p>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.searchBar}>
                    <Search size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar chef o restaurante..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.chefsGrid}>
                    {filteredChefs.map((chef) => (
                        <div key={chef.id} className={styles.chefCard}>
                            <div className={styles.imageWrapper}>
                                <img src={chef.image} alt={chef.name} />
                                {chef.stars ? (
                                    <div className={styles.starsBadge}>
                                        <Star size={12} fill="currentColor" /> {chef.stars}
                                    </div>
                                ) : null}
                            </div>
                            <div className={styles.info}>
                                <div className={styles.specialty}>{chef.specialty}</div>
                                <h3 className={styles.name}>{chef.name}</h3>
                                <div className={styles.restaurant}>
                                    <Utensils size={14} /> <span>{chef.restaurant}</span>
                                </div>
                                <Link href={`/chefs/${chef.id}`} className={styles.viewBtn}>
                                    Ver Perfil <ChevronRight size={14} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
