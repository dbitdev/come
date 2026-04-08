"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import InteractiveGuideMap from '@/components/InteractiveGuideMap';
import { Guide, GuideStop } from '@/types/guide';
import styles from './GuideViewer.module.css';
import Link from 'next/link';
import { ChevronLeft, Share2, Map as MapIcon, BookOpen, Utensils, Award, User, Clock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export default function GuideViewer() {
    const params = useParams();
    const router = useRouter();
    const [guide, setGuide] = useState<Guide | null>(null);
    const [activeStopIndex, setActiveStopIndex] = useState(0);
    const stopRefs = useRef<(HTMLElement | null)[]>([]);
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const [mobileView, setMobileView] = useState<'article' | 'map'>('article');
    const [showToggle, setShowToggle] = useState(true);
    const footerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const fetchGuide = async () => {
            const slug = params.slug as string;
            // For demo purposes, if slug matches our mock, use it.
            if (slug === 'mejores-hamburguesas-cdmx') {
                setGuide(MOCK_GUIDE);
                setLoading(false);
                return;
            }

            try {
                if (!db) return;
                const q = query(collection(db, "guides"), where("slug", "==", slug), limit(1));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    setGuide({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Guide);
                }
            } catch (err) {
                console.error("Error fetching guide:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGuide();
    }, [params.slug]);

    const [headerVisible, setHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setHeaderVisible(false);
            } else if (currentScrollY < lastScrollY.current) {
                setHeaderVisible(true);
            }
            
            setScrolled(currentScrollY > 100);
            lastScrollY.current = currentScrollY;
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowToggle(!entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (footerRef.current) observer.observe(footerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!guide) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = Number(entry.target.getAttribute('data-index'));
                        // Ensure we only update if the index is valid
                        if (!isNaN(index)) {
                            setActiveStopIndex(index);
                        }
                    }
                });
            },
            { threshold: 0.0, rootMargin: '-50% 0px -50% 0px' }
        );

        stopRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [guide]);

    if (loading) return <div className={styles.loading}>Cargando experiencia...</div>;
    if (!guide) return <div className={styles.error}>Guía no encontrada</div>;

    return (
        <div className={styles.publicationWrapper}>
            {/* Minimal Sticky Nav */}
            <nav className={`${styles.stickyNav} ${scrolled ? styles.navActive : ""} ${!headerVisible ? styles.navMainHidden : ""}`}>
                <div className={styles.navContainer}>
                    <Link href="/guias" className={styles.backLink}>
                        <ChevronLeft size={18} /> <span>Guías</span>
                    </Link>
                    <div className={styles.navTitle}>{guide.title}</div>
                    <div className={styles.navActions}>
                        <button className={styles.iconBtn}><Share2 size={18} /></button>
                    </div>
                </div>
            </nav>

            {/* Maganize Header */}
            <header className={styles.hero}>
                <div className={styles.heroImageWrapper}>
                    <img src={guide.heroImage} alt={guide.title} className={styles.heroImg} />
                    <div className={styles.heroOverlay} />
                </div>
                <div className={styles.heroContent}>
                    <div className={styles.guideBadge}>MAPA INTERACTIVO</div>
                    <h1 className={styles.mainTitle}>{guide.title}</h1>
                    <p className={styles.leadText}>{guide.description}</p>
                    <div className={styles.authorMeta}>
                        <div className={styles.avatar}>{guide.authorName[0]}</div>
                        <div className={styles.authorInfo}>
                            <span className={styles.authorLabel}>Publicado por</span>
                            <span className={styles.authorName}>{guide.authorName}</span>
                        </div>
                        <div className={styles.pubDate}>
                            <Clock size={14} /> {new Date(guide.createdAt).toLocaleDateString('es-MX', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </div>
            </header>

            <div className={`${styles.articleBody} ${mobileView === 'map' ? styles.mobileMapActive : ""}`}>
                <div className={`${styles.mainColumn} ${mobileView === 'map' ? styles.hideMobile : ""}`}>
                    {guide.stops.map((stop, index) => (
                        <article 
                            key={stop.id} 
                            className={`${styles.stopSection} ${index === activeStopIndex ? styles.activeSection : ""}`}
                            data-index={index}
                            ref={el => { stopRefs.current[index] = el; }}
                        >
                            <div className={styles.stopHeader}>
                                <span className={styles.indexNumber}>{index + 1}</span>
                                <h2 className={styles.stopTitle}>{stop.title}</h2>
                            </div>

                            {stop.image && (
                                <figure className={styles.figure}>
                                    <img src={stop.image} alt={stop.title} className={styles.stopImg} />
                                </figure>
                            )}

                            <div className={styles.stopText}>
                                {stop.content}
                            </div>

                            {/* Integrated Content Sections (Chefs/Recipes) */}
                            {stop.linkedContent && (
                                <div className={styles.linkedContentCard}>
                                    <div className={styles.linkedIcon}>
                                        {stop.linkedContent.type === 'chef' ? <Award size={20} /> : <Utensils size={20} />}
                                    </div>
                                    <div className={styles.linkedInfo}>
                                        <span className={styles.linkedLabel}>
                                            {stop.linkedContent.type === 'chef' ? "Chef a cargo" : "Receta Destacada"}
                                        </span>
                                        <h4 className={styles.linkedName}>{stop.linkedContent.name}</h4>
                                    </div>
                                    <Link href={`/${stop.linkedContent.type === 'chef' ? 'chefs' : 'recetas'}/${stop.linkedContent.slug || stop.linkedContent.id}`} className={styles.viewMoreLink}>
                                        Ver más
                                    </Link>
                                </div>
                            )}

                            <div className={styles.locationFooter}>
                                <div className={styles.locationBadge}>
                                    <MapPin size={14} /> {stop.location?.name || "Ubicación"}
                                </div>
                                {stop.location?.restaurantId && (
                                    <Link href={`/lugares/${stop.location.restaurantId}`} className={styles.profileLink}>
                                        Ver Perfil Completo
                                    </Link>
                                )}
                            </div>
                        </article>
                    ))}
                </div>

                {/* The Floating Map Container */}
                <aside className={`${styles.mapAside} ${mobileView === 'map' ? styles.showMobileMap : ""}`}>
                    <div className={styles.mapStickyWrapper}>
                        <div className={styles.mapCard}>
                            <div className={styles.mapHeader}>
                                <MapIcon size={16} /> 
                                <span>Explorando {activeStopIndex + 1} de {guide.stops.length}</span>
                            </div>
                            <div className={styles.mapContainer}>
                                <InteractiveGuideMap stops={guide.stops} activeStopIndex={activeStopIndex} />
                            </div>
                            <div className={styles.activeStopFooter}>
                                <strong>{guide.stops[activeStopIndex]?.title}</strong>
                                <p>{guide.stops[activeStopIndex]?.location.address}</p>
                            </div>
                        </div>
                    </div>
                    
                </aside>
            </div>

            {/* Floating Mobile Toggle Button */}
            <button 
                className={`${styles.viewToggle} ${!showToggle ? styles.toggleHidden : ""}`}
                onClick={() => setMobileView(mobileView === 'article' ? 'map' : 'article')}
            >
                {mobileView === 'article' ? (
                    <><MapIcon size={18} /> <span>Ver Mapa</span></>
                ) : (
                    <><BookOpen size={18} /> <span>Ver Publicación</span></>
                )}
            </button>

            <footer className={styles.footer} ref={footerRef}>
                <div className={styles.footerContent}>
                    <h3>Sigue la ruta en Come</h3>
                    <p>Descubre más experiencias y guías exclusivas en nuestra plataforma.</p>
                    <div className={styles.footerLinks}>
                        <Link href="/guias">Más Guías</Link>
                        <Link href="/lugares">Mapa Principal</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const MOCK_GUIDE: Guide = {
  id: 'hamburguesas-cdmx',
  slug: 'mejores-hamburguesas-cdmx',
  title: 'Las Mejores Hamburguesas de la CDMX',
  description: 'Una ruta épica por los rincones más deliciosos de la capital, desde joyas ocultas hasta clásicos imperdibles. Descubre dónde se esconde la carne más jugosa y el pan más suave.',
  heroImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  authorName: 'Rodrigo Casarín',
  status: 'published',
  restaurantIds: ['1', '2', '3'],
  stops: [
    {
      id: '1',
      title: 'Hamburguesas a la Parrilla "El Jefe"',
      content: 'Ubicado en el corazón de la Roma Norte, este lugar se especializa en carne de res de libre pastoreo con un toque ahumado único. Su técnica de sellado a fuego directo crea una costra caramelizada que es simplemente adictiva. No es solo comida rápida, es artesanía entre dos panes.',
      location: { lat: 19.4172, lng: -99.1610, name: 'El Jefe Roma', address: 'Colima 123, Roma Norte', restaurantId: 'eljefe-roma' },
      order: 0,
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
      linkedContent: { type: 'chef', id: 'chef1', name: 'Alfonso Cadena', slug: 'alfonso-cadena' }
    },
    {
      id: '2',
      title: 'Sliders Premium & Co.',
      content: 'Perfecto para quienes quieren probar de todo. Sus sliders de Wagyu con cebolla caramelizada y queso gruyère son una experiencia religiosa. El secreto está en la mantequilla avellanada que usan para tostar el brioche artesanal. Una parada obligatoria para los amantes del detalle.',
      location: { lat: 19.4284, lng: -99.1633, name: 'Sliders Cuauhtémoc', address: 'Av. Álvaro Obregón 45', restaurantId: 'sliders-cuauhtemoc' },
      order: 1,
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80',
      linkedContent: { type: 'recipe', id: 'recipe1', name: 'La Slider Perfecta', slug: 'slider-perfecta' }
    },
    {
      id: '3',
      title: 'The Burger Lab',
      content: 'Innovación pura en el barrio de Polanco. Aquí puedes personalizar absolutamente cada parte de tu hamburguesa, desde el tipo de molienda de la carne hasta infusiones exóticas en sus salsas. El "Laboratorio" es famoso por su atmósfera experimental y su compromiso con la calidad extrema.',
      location: { lat: 19.4326, lng: -99.1913, name: 'Burger Lab Polanco', address: 'Moliere 567, Polanco', restaurantId: 'burger-lab-polanco' },
      order: 2,
      image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80'
    }
  ]
};

function MapPin({ size, className }: { size?: number, className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
}
