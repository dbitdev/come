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
    const [activeNewsIdx, setActiveNewsIdx] = useState(0);
    const [editorRestaurants, setEditorRestaurants] = useState<any[]>([]);
    const [topNews, setTopNews] = useState<any[]>([]);

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

                const newsSnapshot = await getDocs(collection(db, "news"));
                const newsData = newsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).slice(0, 10);
                setTopNews(newsData);
            } catch (err) {
                console.error("Error fetching hero data:", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (editorRestaurants.length === 0 && topNews.length === 0) return;

        const restInterval = setInterval(() => {
            if (editorRestaurants.length > 0) {
                setActiveRestIdx(prev => (prev + 1) % editorRestaurants.length);
            }
        }, 5000);

        const newsInterval = setInterval(() => {
            if (topNews.length > 0) {
                setActiveNewsIdx(prev => (prev + 1) % topNews.length);
            }
        }, 7000);

        return () => {
            clearInterval(restInterval);
            clearInterval(newsInterval);
        };
    }, [editorRestaurants.length, topNews.length]);

    const handleGeolocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                // In a real app we'd reverse geocode the coords to a city name
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
            <div className={styles.grid}>
                {/* Main Box - 2/3 width */}
                <div className={`${styles.box} ${styles.mainBox}`}>
                    <div className={styles.content}>
                        <h1 className={styles.title}>Encuentra los mejores lugares para comer</h1>
                        <p className={styles.subtitle}>Descubre restaurantes épicos y experiencias culinarias inolvidables</p>

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
                                    placeholder="Ciudad o CP"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                            <button type="submit" className={styles.searchButton}>Buscar</button>
                        </form>
                    </div>
                </div>

                {/* Side Boxes - 1/3 width total */}
                <div className={styles.sideColumn}>
                    {/* Top Slider: Restaurants */}
                    <div className={`${styles.box} ${styles.slideBox}`}>
                        {editorRestaurants.map((rest, idx) => (
                            <div 
                                key={rest.id} 
                                className={`${styles.slide} ${idx === activeRestIdx ? styles.activeSlide : ""}`}
                                style={{ backgroundImage: `url(${rest.image})` }}
                            >
                                <div className={styles.slideOverlay}>
                                    <span className={styles.slideBadge}>Sugerido</span>
                                    <h3 className={styles.slideTitle}>{rest.name}</h3>
                                    <p className={styles.slideSubtitle}>{rest.category}</p>
                                </div>
                            </div>
                        ))}
                        <div className={styles.dots}>
                            {editorRestaurants.map((_, idx) => (
                                <span 
                                    key={idx} 
                                    className={`${styles.dot} ${idx === activeRestIdx ? styles.activeDot : ""}`}
                                    onClick={() => setActiveRestIdx(idx)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Bottom Slider: News */}
                    <div className={`${styles.box} ${styles.slideBox}`}>
                        {topNews.map((news, idx) => (
                            <div 
                                key={news.id} 
                                className={`${styles.slide} ${idx === activeNewsIdx ? styles.activeSlide : ""}`}
                                style={{ backgroundImage: `url(${news.image})` }}
                            >
                                <div className={styles.slideOverlay}>
                                    <span className={styles.slideBadge}>Noticia</span>
                                    <h3 className={styles.slideTitle}>{news.title}</h3>
                                </div>
                            </div>
                        ))}
                        <div className={styles.dots}>
                            {topNews.map((_, idx) => (
                                <span 
                                    key={idx} 
                                    className={`${styles.dot} ${idx === activeNewsIdx ? styles.activeDot : ""}`}
                                    onClick={() => setActiveNewsIdx(idx)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
