"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getChefBySlug, Chef } from '@/lib/chefs';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { searchArticles } from '@/lib/wordpress';
import styles from './ChefProfile.module.css';
import Link from 'next/link';
import { 
    Award, 
    Utensils, 
    Star, 
    ChevronLeft, 
    Map as MapIcon,
    BookOpen,
    Clock
} from 'lucide-react';
import { FaInstagram, FaTwitter, FaFacebookF } from 'react-icons/fa';

export default function ChefProfilePage() {
    const params = useParams();
    const [chef, setChef] = useState<Chef | null>(null);
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [guides, setGuides] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChefData = async () => {
            const id = params.id as string;
            const data = getChefBySlug(id);
            if (!data) {
                setLoading(false);
                return;
            }
            setChef(data);

            if (!db) return;
            
            try {
                // 1. Fetch Restaurants
                // First search by direct chef name in the DB
                const qRest = query(
                    collection(db, "business_leads"), 
                    where("chef", "==", data.name),
                    limit(10)
                );
                const restDocs = await getDocs(qRest);
                let foundRestaurants = restDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Fallback: Fetch by manual slugs if none found via name
                if (foundRestaurants.length === 0 && data.featuredRestaurantSlugs?.length) {
                    const qSlugs = query(
                        collection(db, "business_leads"), 
                        where("__name__", "in", data.featuredRestaurantSlugs),
                        limit(5)
                    );
                    const slugDocs = await getDocs(qSlugs);
                    foundRestaurants = slugDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }
                
                setRestaurants(foundRestaurants);

                // 2. Fetch Guides
                const restaurantIds = foundRestaurants.map(d => d.id);
                
                if (restaurantIds.length > 0) {
                    const qGuides = query(
                        collection(db, "guides"),
                        where("restaurantIds", "array-contains-any", restaurantIds),
                        limit(5)
                    );
                    const guideDocs = await getDocs(qGuides);
                    setGuides(guideDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } else {
                    // Fallback search for guides
                    const qRecentGuides = query(collection(db, "guides"), limit(10));
                    const recentGuidesSnap = await getDocs(qRecentGuides);
                    const matchedGuides = recentGuidesSnap.docs
                        .map(doc => ({ id: doc.id, ...doc.data() } as any))
                        .filter(g => 
                            g.title?.toLowerCase().includes(data.name.toLowerCase()) || 
                            g.description?.toLowerCase().includes(data.name.toLowerCase()) ||
                            g.stops?.some((s: any) => s.linkedContent?.name === data.name)
                        );
                    setGuides(matchedGuides.slice(0, 3));
                }

                // 3. Fetch WordPress Articles
                const news = await searchArticles(data.name, 4);
                setArticles(news);

            } catch (err) {
                console.error("Error fetching chef profile data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchChefData();
    }, [params.id]);

    if (loading) return <div className={styles.loading}>Cargando perfil...</div>;
    if (!chef) return <div className={styles.error}>Chef no encontrado</div>;

    return (
        <div className={styles.container}>
            {/* Minimal Sticky Nav */}
            <nav className={styles.stickyNav}>
                <div className={styles.navContent}>
                    <Link href="/guias/chefs" className={styles.backLink}>
                        <ChevronLeft size={18} /> <span>Maestros</span>
                    </Link>
                </div>
            </nav>

            {/* Profile Hero */}
            <header className={styles.hero}>
                <div className={styles.heroGrid}>
                    <div className={styles.imageCol}>
                        <div className={styles.portraitWrapper}>
                            <img src={chef.image} alt={chef.name} className={styles.portrait} />
                            {chef.stars && (
                                <div className={styles.starsBadge}>
                                    <Star size={16} fill="currentColor" /> <span>{chef.stars} Estrellas</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.infoCol}>
                        <div className={styles.roleBadge}>{chef.role}</div>
                        <h1 className={styles.name}>{chef.name}</h1>
                        <p className={styles.bio}>{chef.bio}</p>
                        
                        <div className={styles.accolades}>
                            {chef.accolades?.map((acc, idx) => (
                                <div key={idx} className={styles.accoladeItem}>
                                    <Award size={16} /> <span>{acc}</span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.socials}>
                            {chef.socials?.instagram && <a href={`https://instagram.com/${chef.socials.instagram}`} target="_blank"><FaInstagram size={20} /></a>}
                            {chef.socials?.twitter && <a href={`https://twitter.com/${chef.socials.twitter}`} target="_blank"><FaTwitter size={20} /></a>}
                            <button className={styles.shareBtn}>Seguir Perfil</button>
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.sectionsGrid}>
                    {/* Restaurants Section */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Utensils size={22} /> Su Cocina
                        </h2>
                        <div className={styles.restaurantGrid}>
                            {restaurants.map(res => (
                                <Link key={res.id} href={`/lugares/${res.slug || res.id}`} className={styles.restCard}>
                                    <img src={res.image || "/placeholder-restaurant.jpg"} alt={res.name} />
                                    <div className={styles.restInfo}>
                                        <h3>{res.restaurantName || res.name}</h3>
                                        <span>{res.category}</span>
                                    </div>
                                </Link>
                            ))}
                            {restaurants.length === 0 && <p className={styles.emptyMsg}>No se encontraron restaurantes asociados.</p>}
                        </div>
                    </section>

                    {/* Guides Section */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <MapIcon size={22} /> Rutas & Mapas
                        </h2>
                        <div className={styles.guidesGrid}>
                            {guides.map(guide => (
                                <Link key={guide.id} href={`/guias/${guide.slug}`} className={styles.guideCard}>
                                    <div className={styles.guideThumb}>
                                        <img src={guide.heroImage} alt={guide.title} />
                                        <div className={styles.guideOverlay}>
                                            <span>Ver Guía Interactiva</span>
                                        </div>
                                    </div>
                                    <div className={styles.guideInfo}>
                                        <h3>{guide.title}</h3>
                                        <p>{guide.description?.substring(0, 80)}...</p>
                                    </div>
                                </Link>
                            ))}
                            {guides.length === 0 && <p className={styles.emptyMsg}>Aún no aparece en guías interactivas.</p>}
                        </div>
                    </section>

                    {/* Articles Section */}
                    <section className={styles.sectionFull}>
                        <h2 className={styles.sectionTitle}>
                            <BookOpen size={22} /> Prensa & Crónicas
                        </h2>
                        <div className={styles.newsGrid}>
                            {articles.map(article => (
                                <Link key={article.id} href={`/noticias/${article.slug}`} className={styles.newsItem}>
                                    <div className={styles.newsDate}>
                                        <Clock size={14} /> {new Date(article.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                                    </div>
                                    <h3 dangerouslySetInnerHTML={{ __html: article.title }} />
                                    <div className={styles.newsExcerpt} dangerouslySetInnerHTML={{ __html: article.excerpt?.substring(0, 100) + '...' }} />
                                </Link>
                            ))}
                            {articles.length === 0 && <p className={styles.emptyMsg}>No hay menciones recientes en la prensa.</p>}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
