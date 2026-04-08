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
    const [activeGuidesIdx, setActiveGuidesIdx] = useState(0);
    const [editorRestaurants, setEditorRestaurants] = useState<any[]>([]);
    const [latestNews, setLatestNews] = useState<any[]>([]);
    const [heroGuides, setHeroGuides] = useState<any[]>([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Local placeholders to prevent layout collapse
    const placeholders = {
        restaurant: { name: "Explora la ciudad", category: "Lugares", image: "/placeholder-restaurant.jpg", slug: "" },
        news: { title: "Cultura Gastronómica", categories: { nodes: [{ name: "Editorial" }] }, featuredImage: { node: { sourceUrl: "/news-placeholder.jpg" } }, slug: "" },
        guide: { title: "Guías de Temporada", heroImage: "/guide-placeholder.jpg", description: "Las mejores rutas para hoy.", slug: "" }
    };

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            if (!db) return;
            try {
                // Restaurants
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
                        description: data.description || "Descubre los mejores sabores locales.",
                        ...data
                    };
                }).filter(r => r.image && r.image !== "/placeholder-restaurant.jpg").slice(0, 10);
                
                if (isMounted) setEditorRestaurants(restData);

                // Guides
                const guidesSnapshot = await getDocs(collection(db, "guides"));
                const guidesData = guidesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).slice(0, 5);
                if (isMounted) setHeroGuides(guidesData);

                // News
                const news = await getLatestNews(5);
                if (isMounted) setLatestNews(news);
            } catch (err) {
                console.error("Error fetching hero data:", err);
            } finally {
                if (isMounted) setDataLoaded(true);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (editorRestaurants.length < 2) return;

        const restInterval = setInterval(() => {
            setActiveRestIdx(prev => (prev + 1) % editorRestaurants.length);
        }, 8000);

        return () => clearInterval(restInterval);
    }, [editorRestaurants.length]);

    // Independent interval for side sliders
    useEffect(() => {
        const sideInterval = setInterval(() => {
            if (editorRestaurants.length > 1) {
                setActiveSideRestIdx(prev => (prev + 1) % Math.min(editorRestaurants.length, 5));
            }
            if (latestNews.length > 1) {
                setActiveNewsIdx(prev => (prev + 1) % latestNews.length);
            }
            if (heroGuides.length > 1) {
                setActiveGuidesIdx(prev => (prev + 1) % heroGuides.length);
            }
        }, 10000);

        return () => clearInterval(sideInterval);
    }, [editorRestaurants.length, latestNews.length, heroGuides.length]);

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
                            <span className={styles.eyebrow}>Guia Gastronómica</span>
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
                            <p className={styles.subtitle}>La guía definitiva y curada de las mejores experiencias gastronómicas en México.</p>
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
                    {/* Slide 1: Featured Restaurants (Magazine Style) */}
                    {(() => {
                        const item = editorRestaurants[activeSideRestIdx] || placeholders.restaurant;
                        return (
                            <Link href={item.slug ? `/lugares/${item.slug}` : '#'} className={styles.magazineCard}>
                                <div className={styles.cardThumb} style={{ backgroundImage: `url(${item.image})` }} />
                                <div className={styles.cardBody}>
                                    <span className={styles.cardEyebrow}>Lugares</span>
                                    <h3 className={styles.cardTitle}>{item.name}</h3>
                                    <p className={styles.cardExcerpt}>{item.description?.substring(0, 80)}...</p>
                                </div>
                            </Link>
                        );
                    })()}

                    {/* Slide 2: Editorial News (Magazine Style) */}
                    {(() => {
                        const item = latestNews[activeNewsIdx] || placeholders.news;
                        const thumbUrl = item.featuredImage?.node?.sourceUrl || "/news-placeholder.jpg";
                        return (
                            <Link href={item.slug ? `/noticias/${item.slug}` : '#'} className={styles.magazineCard}>
                                <div className={styles.cardThumb} style={{ backgroundImage: `url(${thumbUrl})` }} />
                                <div className={styles.cardBody}>
                                    <span className={styles.cardEyebrow}>Editorial</span>
                                    <h3 className={styles.cardTitle}>{item.title}</h3>
                                    <p className={styles.cardExcerpt}>
                                        {item.excerpt ? item.excerpt.replace(/<[^>]*>/g, '').substring(0, 80) : "Actualidad gourmet y más."}...
                                    </p>
                                </div>
                            </Link>
                        );
                    })()}

                    {/* Slide 3: Interactive Guides (Magazine Style) */}
                    {(() => {
                        const item = heroGuides[activeGuidesIdx] || placeholders.guide;
                        return (
                            <Link href={item.slug ? `/guias/${item.slug}` : '#'} className={styles.magazineCard}>
                                <div className={styles.cardThumb} style={{ backgroundImage: `url(${item.heroImage || "/guide-placeholder.jpg"})` }} />
                                <div className={styles.cardBody}>
                                    <span className={styles.cardEyebrow}>Guías</span>
                                    <h3 className={styles.cardTitle}>{item.title}</h3>
                                    <p className={styles.cardExcerpt}>{item.description?.substring(0, 80) || "Las mejores rutas curadas."}...</p>
                                </div>
                            </Link>
                        );
                    })()}
                </div>
            </div>
        </section>
    );
}
