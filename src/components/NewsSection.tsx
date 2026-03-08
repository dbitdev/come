import React from 'react';
import Link from 'next/link';
import styles from './NewsSection.module.css';
import { newsArticlesData, restaurantsData, NewsArticle } from '@/data/mockData';
import { FaMapMarkerAlt, FaPlay } from 'react-icons/fa';
import { fetchMexicaGourmetNews } from '@/lib/MexicaTVService';

export default async function NewsSection() {
    let articles: NewsArticle[] = [];
    let isLive = false;

    try {
        const liveArticles = await fetchMexicaGourmetNews();
        if (liveArticles && liveArticles.length > 0) {
            articles = liveArticles;
            isLive = true;
        } else {
            articles = newsArticlesData;
        }
    } catch (error) {
        console.error("Using fallback news data due to API error");
        articles = newsArticlesData;
    }

    // Keyword-based restaurant linking for live articles
    const processedArticles = articles.map(article => {
        if (article.relatedRestaurantIds && article.relatedRestaurantIds.length > 0) return article;
        
        // Simple keyword matching for demo/live data
        const related = restaurantsData.find(r => 
            article.title.toLowerCase().includes(r.name.toLowerCase()) || 
            article.excerpt.toLowerCase().includes(r.name.toLowerCase())
        );

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
                            ? restaurantsData.find(r => r.id === news.relatedRestaurantIds![0])
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
                                            {relatedRest && (
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

                        if (relatedRest) {
                            return (
                                <Link key={news.id} href={`/lugares/${relatedRest.id}`} className={styles.cardLink}>
                                    {cardContent}
                                </Link>
                            );
                        }

                        return <div key={news.id} className={styles.cardWrapper}>{cardContent}</div>;
                    })}
                </div>
            </div>
        </section>
    );
}
