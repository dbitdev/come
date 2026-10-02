"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getChefBySlug, type Chef } from '@/lib/chefs';
import RetratoChef from '@/components/RetratoChef';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { searchArticles } from '@/lib/wordpress';
import styles from './ChefProfile.module.css';
import Link from 'next/link';
import {
    Award,
    Utensils,
    Star,
    ChevronRight,
    MapPin,
    Map as MapIcon,
    BookOpen,
    Clock
} from 'lucide-react';
import { FaInstagram, FaTwitter, FaFacebookF } from 'react-icons/fa';
import { rutaLugar } from "@/lib/utils";
import { lugaresQueMencionan } from '@/lib/vinculos';
import FeedSocialCarousel from '@/components/FeedSocialCarousel';
import { obtenerFeedChef } from '@/lib/feedSocial';

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
            const data = await getChefBySlug(id);
            if (!data) {
                setLoading(false);
                return;
            }
            setChef(data);

            if (!db) return;
            
            try {
                // 1. Sus restaurantes.
                // La igualdad exacta contra `chef` fallaba en cuanto un lugar
                // tenía dos chefs: "Julio Castillo, Hugo Jimenez" no es igual a
                // ninguno de los dos nombres. Ahora se consulta por el arreglo de
                // ids, y se conserva el barrido por nombre para los documentos
                // que todavía no se han migrado.
                const [porIdActual, porIdPrevio] = await Promise.all([
                    getDocs(query(collection(db, "come"), where("chefIds", "array-contains", data.id), limit(10))),
                    getDocs(query(collection(db, "come"), where("chefIdsPrevios", "array-contains", data.id), limit(10))),
                ]);

                const encontrados = new Map<string, any>();
                porIdActual.docs.forEach(d => encontrados.set(d.id, { id: d.id, ...d.data(), esPrevio: false }));
                porIdPrevio.docs.forEach(d => {
                    if (!encontrados.has(d.id)) encontrados.set(d.id, { id: d.id, ...d.data(), esPrevio: true });
                });

                if (encontrados.size === 0) {
                    const todos = await getDocs(query(collection(db, "come"), limit(60)));
                    lugaresQueMencionan(
                        data.name,
                        todos.docs.map(d => {
                            const v = d.data();
                            return { id: d.id, nombre: v.restaurantName || v.name || "", chef: v.chef };
                        }),
                    ).forEach(lugar => {
                        const original = todos.docs.find(d => d.id === lugar.id);
                        if (original) encontrados.set(lugar.id, { id: lugar.id, ...original.data(), esPrevio: false });
                    });
                }

                const foundRestaurants = [...encontrados.values()];
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

    if (loading) return <div className={styles.loading}>Cargando perfil…</div>;
    if (!chef) return <div className={styles.error}>Chef no encontrado</div>;

    const feedSocial = obtenerFeedChef({
        name: chef.name,
        image: chef.image,
        redes: chef.redes,
        socialVideos: chef.socialVideos,
    });

    const restauranteActual = restaurants.find((r) => !r.esPrevio) || restaurants[0];

    return (
        <div className={styles.page}>
            {/* ── Hero: nombre sobre la foto ── */}
            <header className={styles.hero}>
                <RetratoChef src={chef.image} nombre={chef.name} className={styles.heroImg} />
                <div className={styles.heroScrim} />
                <div className={styles.heroInner}>
                    <nav className={styles.crumbs} aria-label="Ruta de navegación">
                        <Link href="/">Inicio</Link>
                        <span aria-hidden="true">/</span>
                        <Link href="/chefs">Chefs</Link>
                    </nav>
                    <p className={styles.heroEyebrow}>{chef.role}</p>
                    <h1 className={styles.heroName}>{chef.name}</h1>
                    <div className={styles.heroMeta}>
                        {chef.stars ? (
                            <span className={styles.metaItem}>
                                <Star size={16} fill="var(--accent-warm)" color="var(--accent-warm)" />
                                {chef.stars} {chef.stars === 1 ? 'Estrella' : 'Estrellas'} Michelin
                            </span>
                        ) : null}
                        {chef.restaurant && <span className={styles.metaItem}><Utensils size={15} /> {chef.restaurant}</span>}
                        {chef.ubicacion && <span className={styles.metaItem}><MapPin size={15} /> {chef.ubicacion}</span>}
                    </div>
                </div>
            </header>

            <div className={styles.shell}>
                {/* ── Columna de contenido ── */}
                <div className={styles.content}>
                    {chef.bio && <p className={styles.lead}>{chef.bio}</p>}

                    <section className={styles.block}>
                        <div className={styles.blockHead}>
                            <span className={styles.eyebrow}>Su cocina</span>
                            <h2>Dónde lo encuentras</h2>
                        </div>
                        {restaurants.length > 0 ? (
                            <div className={styles.restGrid}>
                                {restaurants.map((res) => (
                                    <Link key={res.id} href={rutaLugar(res.restaurantName || res.name, res.id)} className={styles.restCard}>
                                        <img src={res.image || '/placeholder-restaurant.jpg'} alt={res.restaurantName || res.name} />
                                        <div className={styles.restOverlay}>
                                            <h3>{res.restaurantName || res.name}</h3>
                                            {res.category && <span>{res.category}</span>}
                                            {res.esPrevio && <em className={styles.restPrevio}>Estuvo aquí</em>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.emptyMsg}>No hay restaurantes asociados todavía.</p>
                        )}
                    </section>

                    {guides.length > 0 && (
                        <section className={styles.block}>
                            <div className={styles.blockHead}>
                                <span className={styles.eyebrow}>Rutas y mapas</span>
                                <h2>Guías donde aparece</h2>
                            </div>
                            <div className={styles.miniList}>
                                {guides.map((guide) => (
                                    <Link key={guide.id} href={`/guias/${guide.slug}`} className={styles.miniCard}>
                                        <div className={styles.miniThumb}>
                                            <img src={guide.heroImage || '/news-placeholder.jpg'} alt={guide.title} />
                                        </div>
                                        <div className={styles.miniInfo}>
                                            <h3>{guide.title}</h3>
                                            {guide.description && <p>{guide.description}</p>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {articles.length > 0 && (
                        <section className={styles.block}>
                            <div className={styles.blockHead}>
                                <span className={styles.eyebrow}>En la prensa</span>
                                <h2>Prensa y crónicas</h2>
                            </div>
                            <div className={styles.miniList}>
                                {articles.map((article) => (
                                    <Link key={article.id} href={`/noticias/${article.slug}`} className={styles.miniCard}>
                                        <div className={styles.miniThumb}>
                                            <img src={article.featuredImage?.node?.sourceUrl || '/news-placeholder.jpg'} alt="" />
                                        </div>
                                        <div className={styles.miniInfo}>
                                            <h3 dangerouslySetInnerHTML={{ __html: article.title }} />
                                            <span className={styles.miniMeta}>
                                                <Clock size={13} /> {new Date(article.date).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {feedSocial.items.length > 0 && (
                        <section className={styles.block}>
                            <FeedSocialCarousel
                                titulo={`En redes con ${chef.name}`}
                                subtitulo="TIKTOK E INSTAGRAM"
                                items={feedSocial.items}
                                cuentas={feedSocial.cuentas}
                            />
                        </section>
                    )}
                </div>

                {/* ── Barra lateral ── */}
                <aside className={styles.aside}>
                    <div className={styles.panel}>
                        {chef.logroClave && (
                            <div className={styles.panelBlock}>
                                <span className={styles.panelLabel}><Award size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />Logro clave</span>
                                <div className={styles.panelBig}>{chef.logroClave}</div>
                            </div>
                        )}

                        {(restauranteActual || chef.restaurant) && (
                            <div className={styles.panelBlock}>
                                <span className={styles.panelLabel}>Cocina en</span>
                                {restauranteActual ? (
                                    <Link href={rutaLugar(restauranteActual.restaurantName || restauranteActual.name, restauranteActual.id)} className={styles.panelPlace}>
                                        <Utensils size={16} /> {restauranteActual.restaurantName || restauranteActual.name}
                                    </Link>
                                ) : (
                                    <span className={styles.panelPlace}><Utensils size={16} /> {chef.restaurant}</span>
                                )}
                            </div>
                        )}

                        {chef.ubicacion && (
                            <div className={styles.panelBlock}>
                                <span className={styles.panelLabel}>Dónde</span>
                                <p className={styles.panelText}><MapPin size={15} style={{ verticalAlign: '-2px', marginRight: 4, color: 'var(--primary)' }} />{chef.ubicacion}</p>
                            </div>
                        )}

                        <div className={styles.panelBlock}>
                            {chef.redes.length > 0 && (
                                <div className={styles.panelSocials}>
                                    {chef.redes.map((perfil) => (
                                        <a key={perfil.red + perfil.usuario} href={perfil.url} target="_blank" rel="noopener noreferrer" title={perfil.usuario} aria-label={`${perfil.red} de ${chef.name}`}>
                                            {perfil.red === 'instagram' ? <FaInstagram size={22} /> : perfil.red === 'facebook' ? <FaFacebookF size={22} /> : <FaTwitter size={22} />}
                                        </a>
                                    ))}
                                </div>
                            )}
                            <button className={styles.followBtn}>Seguir perfil</button>
                            {!chef.userId && (
                                <Link className={styles.claimLink} href={`/reclamar/chef/${chef.id}?nombre=${encodeURIComponent(chef.name)}`}>
                                    ¿Este perfil es tuyo? Reclámalo
                                </Link>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
