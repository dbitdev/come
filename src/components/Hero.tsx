"use client";

import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import styles from "./Hero.module.css";

export default function Hero() {
    const [location, setLocation] = useState("");
    const [query, setQuery] = useState("");
    const [activeRestIdx, setActiveRestIdx] = useState(0);
    const [editorRestaurants, setEditorRestaurants] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!db) return;
            try {
                const restSnapshot = await getDocs(collection(db, "business_leads"));
                const restData = restSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.restaurantName || data.name,
                        image: (data.menu && data.menu[0]?.image) || data.image || "/placeholder-restaurant.jpg",
                        category: data.category,
                        ...data
                    };
                }).filter(r => r.image && r.image !== "/placeholder-restaurant.jpg").slice(0, 10);
                setEditorRestaurants(restData);
            } catch (err) {
                console.error("Error fetching hero data:", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (editorRestaurants.length === 0) return;

        const restInterval = setInterval(() => {
            setActiveRestIdx(prev => (prev + 1) % editorRestaurants.length);
        }, 6000);

        return () => {
            clearInterval(restInterval);
        };
    }, [editorRestaurants.length]);

    const handleGeolocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setLocation("Cerca de mi ubicación actual");
            });
        } else {
            alert("Geolocalización no soportada en este navegador.");
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query) params.set("search", query);
        if (location) params.set("location", location);
        
        window.location.href = `/lugares?${params.toString()}`;
    };

    return (
        <section className={styles.hero}>
            {editorRestaurants.map((rest, idx) => (
                <div 
                    key={rest.id} 
                    className={`${styles.bgSlide} ${idx === activeRestIdx ? styles.activeSlide : ""}`}
                    style={{ backgroundImage: `url(${rest.image})` }}
                >
                    <div className={styles.bgOverlay} />
                    {idx === activeRestIdx && (
                        <div className={styles.activeRestInfo}>
                            <span className={styles.restCategory}>{rest.category}</span>
                            <span className={styles.restName}>{rest.name}</span>
                        </div>
                    )}
                </div>
            ))}
            
            <div className={styles.contentWrapper}>
                <div className={styles.textContent}>
                    <span className={styles.eyebrow}>Club Gastronómico</span>
                    <h1 className={styles.title}>Eres donde Comes</h1>
                    <p className={styles.subtitle}>La guía definitiva y curada de las mejores experiencias gastronómicas en México, reservada para los paladares más exigentes.</p>
                </div>
                
                <form className={styles.searchForm} onSubmit={handleSearch}>
                    <div className={styles.inputGroup}>
                        <FaSearch className={styles.icon} />
                        <input
                            type="text"
                            placeholder="Restaurante, tipo de comida..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.divider}></div>
                    <div className={styles.inputGroup}>
                        <FaMapMarkerAlt className={styles.iconLocation} onClick={handleGeolocation} title="Usar mi ubicación" />
                        <input
                            type="text"
                            placeholder="Ciudad o región..."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    <button type="submit" className={styles.searchButton}>Descubrir</button>
                </form>
            </div>

            <div className={styles.dots}>
                {editorRestaurants.map((_, idx) => (
                    <span 
                        key={idx} 
                        className={`${styles.dot} ${idx === activeRestIdx ? styles.activeDot : ""}`}
                        onClick={() => setActiveRestIdx(idx)}
                    />
                ))}
            </div>
        </section>
    );
}
