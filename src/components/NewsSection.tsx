"use client";

import React, { useEffect, useState } from 'react';
import styles from './NewsSection.module.css';
import Link from 'next/link';
import { Play, Clock, ArrowRight } from 'lucide-react';
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
    // Pick two other articles for the sides (cyclical relative to activeIdx)
    const leftArticle = articles[(activeIdx + articles.length - 1) % articles.length];
    const rightArticle = articles[(activeIdx + 1) % articles.length];

    return (
        <section className={styles.section} id="noticias">
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.badge}>Editorial</div>
                    <h2 className={styles.title}>Crónicas Gastronómicas</h2>
                </div>

                <div className={styles.layoutGrid}>
                    {/* Left Small Card */}
                    <div className={styles.sideColumn}>
                        <article 
                            className={`${styles.sideCard} liquid-glass`}
                            style={{ backgroundImage: `url(${leftArticle.featuredImage?.node?.sourceUrl || "/news-placeholder.jpg"})` }}
                        >
                            <div className={styles.cardOverlay}>
                                <div className={styles.sideContent}>
                                    <span className={styles.sideCategory}>
                                        {leftArticle.categories?.nodes?.[0]?.name || 'Gourmet'}
                                    </span>
                                    <Link href={`/noticias/${leftArticle.slug}`}>
                                        <h4 className={styles.sideTitle}>{leftArticle.title}</h4>
                                    </Link>
                                    <Link href={`/noticias/${leftArticle.slug}`} className={styles.sideLink}>
                                        Ver más
                                    </Link>
                                </div>
                            </div>
                        </article>
                    </div>

                    {/* Main Featured Center Card */}
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
                                            <Clock size={16} strokeWidth={1.5} /> {new Date(featured.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <Link href={`/noticias/${featured.slug}`}>
                                        <h3 className={styles.mainTitle}>{featured.title}</h3>
                                    </Link>
                                    <div className={styles.actions}>
                                        <Link 
                                            href={`/noticias/${featured.slug}`} 
                                            className={styles.primaryBtn}
                                        >
                                            Leer Historia <ArrowRight size={18} strokeWidth={1.5} />
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

                    {/* Right Small Card */}
                    <div className={styles.sideColumn}>
                        <article 
                            className={`${styles.sideCard} liquid-glass`}
                            style={{ backgroundImage: `url(${rightArticle.featuredImage?.node?.sourceUrl || "/news-placeholder.jpg"})` }}
                        >
                            <div className={styles.cardOverlay}>
                                <div className={styles.sideContent}>
                                    <span className={styles.sideCategory}>
                                        {rightArticle.categories?.nodes?.[0]?.name || 'Gourmet'}
                                    </span>
                                    <Link href={`/noticias/${rightArticle.slug}`}>
                                        <h4 className={styles.sideTitle}>{rightArticle.title}</h4>
                                    </Link>
                                    <Link href={`/noticias/${rightArticle.slug}`} className={styles.sideLink}>
                                        Ver más
                                    </Link>
                                </div>
                            </div>
                        </article>
                    </div>
                </div>
            </div>
        </section>
    );
}
