"use client";

import React, { useEffect, useState } from 'react';
import styles from './NewsSection.module.css';
import Link from 'next/link';
import { FaPlay, FaRegClock, FaArrowRight } from 'react-icons/fa';
import { getLatestNews } from '@/lib/wordpress';

export default function NewsSection() {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetching only 'gourmet' and 'come' tags
                const news = await getLatestNews(6, undefined, ["gourmet", "come"]);
                setArticles(news);
            } catch (error) {
                console.error("Error loading news feed:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Auto-slide for the featured "slider" card
    useEffect(() => {
        if (articles.length <= 1) return;
        const interval = setInterval(() => {
            setActiveIdx(prev => (prev + 1) % Math.min(articles.length, 3));
        }, 5000);
        return () => clearInterval(interval);
    }, [articles.length]);

    if (loading) return (
        <div className={styles.loadingWrapper}>
            <div className={styles.loader}></div>
            <p>Sincronizando con el mundo gourmet...</p>
        </div>
    );

    if (articles.length === 0) return null;

    const featured = articles[activeIdx] || articles[0];
    const sideArticles = articles.filter((_, i) => i !== activeIdx).slice(0, 2);

    return (
        <section className={styles.section} id="noticias">
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.badge}>Editorial</div>
                    <h2 className={styles.title}>Crónicas Gastronómicas</h2>
                </div>

                <div className={styles.layoutGrid}>
                    {/* Main Featured Slider-like card */}
                    <div className={styles.mainColumn}>
                        <article 
                            className={`${styles.mainCard} liquid-glass`}
                            style={{ backgroundImage: `url(${featured.featuredImage?.node?.sourceUrl || "/news-placeholder.jpg"})` }}
                        >
                            <div className={styles.cardOverlay}>
                                <div className={styles.content}>
                                    <div className={styles.meta}>
                                        <span className={styles.category}>
                                            {featured.categories?.nodes?.[0]?.name || 'Gourmet'}
                                        </span>
                                        <span className={styles.date}>
                                            <FaRegClock /> {new Date(featured.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <Link href={`/noticias/${featured.slug}`}>
                                        <h3 className={styles.mainTitle}>{featured.title}</h3>
                                    </Link>
                                    <div 
                                        className={styles.mainExcerpt}
                                        dangerouslySetInnerHTML={{ __html: featured.excerpt }}
                                    />
                                    <div className={styles.actions}>
                                        <Link 
                                            href={`/noticias/${featured.slug}`} 
                                            className={styles.primaryBtn}
                                        >
                                            Leer Historia <FaArrowRight />
                                        </Link>
                                        <div className={styles.sliderDots}>
                                            {articles.slice(0, 3).map((_, i) => (
                                                <span 
                                                    key={i} 
                                                    className={`${styles.dot} ${i === activeIdx ? styles.activeDot : ""}`}
                                                    onClick={() => setActiveIdx(i)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>

                    {/* Side Small Cards */}
                    <div className={styles.sideColumn}>
                        {sideArticles.map((news) => (
                            <article 
                                key={news.id} 
                                className={`${styles.sideCard} liquid-glass`}
                                style={{ backgroundImage: `url(${news.featuredImage?.node?.sourceUrl || "/news-placeholder.jpg"})` }}
                            >
                                <div className={styles.cardOverlay}>
                                    <div className={styles.sideContent}>
                                        <span className={styles.sideCategory}>
                                            {news.categories?.nodes?.[0]?.name || 'Gourmet'}
                                        </span>
                                        <Link href={`/noticias/${news.slug}`}>
                                            <h4 className={styles.sideTitle}>{news.title}</h4>
                                        </Link>
                                        <Link 
                                            href={`/noticias/${news.slug}`} 
                                            className={styles.sideLink}
                                        >
                                            Ver más
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
