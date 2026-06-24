"use client";

import React, { useEffect, useState } from 'react';
import styles from './NoticiasPage.module.css';
import Link from 'next/link';
import { Clock, ArrowRight, Search } from 'lucide-react';
import { getLatestNews } from '@/lib/wordpress';

export default function NoticiasPage() {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const news = await getLatestNews(12);
                setArticles(news);
            } catch (error) {
                console.error("Error loading news listing:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredArticles = articles.filter(art => 
        art.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className={styles.loadingWrapper}>
            <div className={styles.loader}></div>
            <p>Preparando la edición del día...</p>
        </div>
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <span className="mag-label">Editorial & Crónicas</span>
                <h1 className="mixed-heading">Noticias <span>Gastronómicas</span></h1>
                <p className={styles.subtitle}>
                    Explora las historias detrás de los sabores, las tendencias que definen el presente y el futuro de la cocina en México.
                </p>
                
                <div className={styles.searchBar}>
                    <Search size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar artículos o tendencias..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <main className={styles.main}>
                <div className="section-bar">
                    <span>Todas las historias</span>
                    <span>{filteredArticles.length} Artículos</span>
                </div>

                <div className={styles.newsGrid}>
                    {filteredArticles.map((article, idx) => (
                        <article key={article.id} className={`${styles.newsCard} ${idx === 0 ? styles.featured : ''}`}>
                            <div className={styles.imageWrapper}>
                                <img 
                                    src={article.featuredImage?.node?.sourceUrl || "/news-placeholder.jpg"} 
                                    alt={article.title} 
                                />
                                <div className={styles.categoryBadge}>
                                    {article.categories?.nodes?.[0]?.name || 'Gourmet'}
                                </div>
                            </div>
                            <div className={styles.content}>
                                <div className={styles.meta}>
                                    <Clock size={14} />
                                    <span>{new Date(article.date).toLocaleDateString()}</span>
                                </div>
                                <Link href={`/noticias/${article.slug}`}>
                                    <h3 className={styles.articleTitle}>{article.title}</h3>
                                </Link>
                                <p className={styles.excerpt}>
                                    {article.excerpt?.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
                                </p>
                                <Link href={`/noticias/${article.slug}`} className={styles.readMore}>
                                    Seguir leyendo <ArrowRight size={16} />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </main>
        </div>
    );
}
