"use client";

import React, { useState, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getLatestNews } from "@/lib/wordpress";
import styles from "./Hero.module.css";
import Link from 'next/link';
import { slugify } from "@/lib/utils";

export default function Hero() {
    const [location, setLocation] = useState("");
    const [query, setQuery] = useState("");
    const [activeRestIdx, setActiveRestIdx] = useState(0);
    const [activeNewsIdx, setActiveNewsIdx] = useState(0);
    const [activeSideRestIdx, setActiveSideRestIdx] = useState(0);
    const [editorRestaurants, setEditorRestaurants] = useState<any[]>([]);
    const [latestNews, setLatestNews] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!db) return;
            try {
                const restSnapshot = await getDocs(collection(db, "business_leads"));
                const restData = restSnapshot.docs.map(doc => {
                    const data = doc.data();
                    const name = data.restaurantName || data.name;
                    return {
                        id: doc.id,
                        name: name,
                        slug: slugify(name),
                        image: (data.menu && data.menu[0]?.image) || data.image || "/placeholder-restaurant.jpg",
                        category: data.category,
                        ...data
                    };
                }).filter(r => r.image && r.image !== "/placeholder-restaurant.jpg").slice(0, 10);
                setEditorRestaurants(restData);
            } catch (err) {
                console.error("Error fetching hero data:", err);
            }

            try {
                const news = await getLatestNews(5);
                setLatestNews(news);
            } catch (err) {
                console.error("Error fetching news for hero:", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (editorRestaurants.length === 0) return;

        const restInterval = setInterval(() => {
            setActiveRestIdx(prev => (prev + 1) % editorRestaurants.length);
        }, 8000);

        return () => clearInterval(restInterval);
    }, [editorRestaurants.length]);

    // Independent interval for side sliders
    useEffect(() => {
        if (editorRestaurants.length === 0 && latestNews.length === 0) return;

        const sideInterval = setInterval(() => {
            if (editorRestaurants.length > 0) {
                setActiveSideRestIdx(prev => (prev + 1) % Math.min(editorRestaurants.length, 5));
            }
            if (latestNews.length > 0) {
                setActiveNewsIdx(prev => (prev + 1) % latestNews.length);
            }
        }, 5000);

        return () => clearInterval(sideInterval);
    }, [editorRestaurants.length, latestNews.length]);

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
            <div className={styles.container}>
                <div className={styles.heroBox}>
                    {/* Background images now limited to this box */}
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

                    <div className={styles.heroContent}>
                        <div className={styles.textContent}>
                            <span className={styles.eyebrow}>Club Gastronómico</span>
                            <h1 className={styles.title}>Eres donde Comes</h1>
                        </div>

                        <form className={styles.searchForm} onSubmit={handleSearch}>
                            <div className={styles.inputGroup}>
                                <Search className={styles.icon} size={20} strokeWidth={1.5} />
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
                                <MapPin className={styles.iconLocation} onClick={handleGeolocation} size={20} strokeWidth={1.5} />
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

                        <div className={styles.textContent}>
                            <p className={styles.subtitle}>La guía definitiva y curada de las mejores experiencias gastronómicas en México, reservada para los paladares más exigentes.</p>
                        </div>
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
                </div>

                <div className={styles.rightSection}>
                    {/* Top Slider: Restaurants */}
                    <div className={styles.sideSliderBox}>
                        <div className={styles.sliderLabel}>Destacados</div>
                        {editorRestaurants.length > 0 && (
                            <Link href={`/lugares/${editorRestaurants[activeSideRestIdx].slug}`} className={styles.sliderLink}>
                                <div 
                                    className={styles.sliderItem}
                                    style={{ backgroundImage: `url(${editorRestaurants[activeSideRestIdx].image})` }}
                                >
                                    <div className={styles.sliderOverlay}>
                                        <span className={styles.sliderCategory}>{editorRestaurants[activeSideRestIdx].category}</span>
                                        <h3 className={styles.sliderTitle}>{editorRestaurants[activeSideRestIdx].name}</h3>
                                    </div>
                                </div>
                            </Link>
                        )}
                        <div className={styles.miniDots}>
                            {editorRestaurants.slice(0, 5).map((_, i) => (
                                <span key={i} className={`${styles.miniDot} ${i === activeSideRestIdx ? styles.miniDotActive : ""}`} />
                            ))}
                        </div>
                    </div>

                    {/* Bottom Slider: Publications */}
                    <div className={styles.sideSliderBox}>
                        <div className={styles.sliderLabel}>Editorial</div>
                        {latestNews.length > 0 && (
                            <Link href={`/noticias/${latestNews[activeNewsIdx].slug}`} className={styles.sliderLink}>
                                <div 
                                    className={styles.sliderItem}
                                    style={{ backgroundImage: `url(${latestNews[activeNewsIdx].featuredImage?.node?.sourceUrl || "/news-placeholder.jpg"})` }}
                                >
                                    <div className={styles.sliderOverlay}>
                                        <span className={styles.sliderCategory}>{latestNews[activeNewsIdx].categories?.nodes?.[0]?.name || 'Gourmet'}</span>
                                        <h3 className={styles.sliderTitle}>{latestNews[activeNewsIdx].title}</h3>
                                    </div>
                                </div>
                            </Link>
                        )}
                        <div className={styles.miniDots}>
                            {latestNews.map((_, i) => (
                                <span key={i} className={`${styles.miniDot} ${i === activeNewsIdx ? styles.miniDotActive : ""}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
