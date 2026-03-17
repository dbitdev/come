"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './NewsSection.module.css';
import { NewsArticle } from '@/types';
import { FaMapMarkerAlt, FaPlay } from 'react-icons/fa';
import { fetchMexicaGourmetNews } from '@/lib/MexicaTVService';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function NewsSection() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [isLive, setIsLive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [restaurants, setRestaurants] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load News
                if (db) {
                    const newsSnapshot = await getDocs(collection(db, "news"));
                    const newsData = newsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as any[];
                    
                    if (newsData.length > 0) {
                        setArticles(newsData);
                    }
                }

                // Load Restaurants for linking
                if (db) {
                    const querySnapshot = await getDocs(collection(db, "business_leads"));
                    const restData = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().restaurantName || doc.data().name,
                        ...doc.data()
                    }));
                    setRestaurants(restData);
                }
            } catch (error) {
                console.error("Error loading news feed:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className={styles.loading}>Cargando noticias...</div>;

    // Keyword-based restaurant linking for live articles
    const processedArticles = articles.map(article => {
        if (article.relatedRestaurantIds && article.relatedRestaurantIds.length > 0) return article;
        
        // Simple keyword matching for demo/live data
        const related = restaurants.find(r => {
            const rName = (r.name || "").toLowerCase();
            const aTitle = (article.title || "").toLowerCase();
            const aExcerpt = (article.excerpt || "").toLowerCase();
            return rName && (aTitle.includes(rName) || aExcerpt.includes(rName));
        });

        return {
            ...article,
            relatedRestaurantIds: related ? [related.id] : []
        };
    });

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.titleRow}>
                        <h2>
                            Noticias y Tendencias
                            {isLive && <span className={styles.liveBadge}>En Vivo</span>}
                        </h2>
                    </div>
                    <p className={styles.subtitle}>Lo último de Mexica Gourmet y el mundo gastronómico</p>
                </div>

                <div className={styles.grid}>
                    {processedArticles.map((news, index) => {
                        const relatedRest = news.relatedRestaurantIds && news.relatedRestaurantIds.length > 0
                            ? restaurants.find(r => r.id === news.relatedRestaurantIds![0])
                            : null;

                        const isFeatured = index === 0;
                        const hasVideo = !!news.videoUrl;

                        const cardContent = (
                            <article className={`${styles.card} ${isFeatured ? styles.featured : ""} ${hasVideo && !isFeatured ? styles.hasVideo : ""}`}>
                                <div className={styles.imageWrapper}>
                                    {isFeatured && hasVideo && news.videoUrl ? (
                                        <div className={styles.videoContainer}>
                                            <iframe 
                                                src={`${news.videoUrl}?autoplay=1&mute=1&loop=1&playlist=${news.videoUrl.split('/').pop()?.split('?')[0]}`}
                                                title={news.title}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className={styles.videoFrame}
                                            ></iframe>
                                        </div>
                                    ) : (
                                        <img src={news.image} alt={news.title} className={styles.image} />
                                    )}
                                    
                                    {hasVideo && !isFeatured && (
                                        <div className={styles.playIcon}>
                                            <FaPlay />
                                        </div>
                                    )}

                                    <div className={styles.overlay}>
                                        <div className={styles.meta}>
                                            <span className={styles.date}>{news.date}</span>
                                            {relatedRest && relatedRest.address && (
                                                <span className={styles.location}>
                                                    <FaMapMarkerAlt /> {relatedRest.address.split(',')[0]}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className={styles.title}>{news.title}</h3>
                                        <p className={isFeatured ? styles.featuredExcerpt : styles.excerpt}>
                                            {news.excerpt}
                                        </p>
                                        <button className={styles.readMore}>
                                            {hasVideo ? 'Ver Video' : 'Leer artículo'}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );

                        return (
                            <a 
                                key={news.id} 
                                href="https://mexicatv.com/gourmet/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={styles.cardLink}
                            >
                                {cardContent}
                            </a>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
