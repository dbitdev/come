import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import SinglePlaceMapWrapper from '@/components/SinglePlaceMapWrapper';
import { 
    MapPin, 
    Star, 
    UtensilsCrossed, 
    Globe, 
    Phone, 
    Navigation, 
    ChevronRight,
    BookOpen
} from 'lucide-react';
import { FaInstagram, FaFacebookF, FaTwitter } from 'react-icons/fa';
import { slugify } from '@/lib/utils';
import Link from 'next/link';
import styles from './profile.module.css';
import { searchArticles } from '@/lib/wordpress';
import { Metadata } from 'next';
import Script from 'next/script';

interface Restaurant {
    id: string;
    name: string;
    restaurantName?: string;
    category: string;
    image: string;
    rating: string | number;
    address: string;
    description?: string;
    chef?: string;
    signatureDishes?: string[];
    isMichelin?: boolean;
    michelinStars?: number;
    phone?: string;
    website?: string;
    socials?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
    };
    lat?: number | string;
    lng?: number | string;
}

async function getRestaurant(slug: string): Promise<Restaurant | null> {
    try {
        if (!db) return null;
        const qRest = collection(db, "business_leads");
        const querySnapshot = await getDocs(qRest);
        
        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            const name = data.restaurantName || data.name || "";
            const computedSlug = slugify(name);
            
            if (computedSlug === slug || docSnap.id === slug) {
                return { id: docSnap.id, name, ...data } as Restaurant;
            }
        }
    } catch (err) {
        console.error("Error fetching restaurant:", err);
    }
    return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const restaurant = await getRestaurant(decodeURIComponent(slug));
    
    if (!restaurant) {
        return {
            title: "Restaurante no encontrado | Néctar",
        };
    }

    const title = `${restaurant.name} - ${restaurant.category} | Néctar`;
    const description = restaurant.description || `Descubre ${restaurant.name} en la Ciudad de México. ${restaurant.category} de alta gama en Néctar.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [restaurant.image],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [restaurant.image],
        },
    };
}

export default async function RestaurantProfile({ params }: { params: Promise<{ slug: string }> }) {
    const { slug: slugParam } = await params;
    const slug = decodeURIComponent(slugParam);
    
    let restaurant: Restaurant | null = null;
    let relatedArticles: any[] = [];
    let similarPlaces: any[] = [];

    try {
        if (!db) throw new Error("Firebase DB not initialized");

        const foundData = await getRestaurant(slug);
        if (foundData) {
            restaurant = foundData;
            const name = restaurant.name;
            const id = restaurant.id;
            
            // Note: Geocoding on server is only possible if API key is in environment variables.
            // For now, we rely on existing coordinates.

            // Fetch related articles from WordPress
            relatedArticles = await searchArticles(name, 3);

            // Fetch similar places (same category, excluding current)
            const qSimilar = query(
                collection(db, "business_leads"),
                where("category", "==", restaurant.category),
                limit(5)
            );
            const similarSnap = await getDocs(qSimilar);
            similarPlaces = similarSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(p => p.id !== id)
                .slice(0, 4);

            // NEW: Fetch guides where this restaurant appears
            const qGuides = query(
                collection(db, "guides"),
                where("restaurantIds", "array-contains", id),
                limit(3)
            );
            const guidesSnap = await getDocs(qGuides);
            const featuredInGuides = guidesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            (restaurant as any).featuredInGuides = featuredInGuides;
        }
    } catch (err) {
        console.error("Error fetching restaurant profile data:", err);
    }

    if (!restaurant) {
        notFound();
    }

    const latNum = restaurant.lat ? Number(restaurant.lat) : null;
    const lngNum = restaurant.lng ? Number(restaurant.lng) : null;
    const hasCoords = latNum !== null && lngNum !== null && !isNaN(latNum) && !isNaN(lngNum);

    const googleMapsUrl = hasCoords 
        ? `https://www.google.com/maps/dir/?api=1&destination=${latNum},${lngNum}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: restaurant.name,
        image: restaurant.image,
        description: restaurant.description,
        address: {
            '@type': 'PostalAddress',
            streetAddress: restaurant.address,
            addressLocality: 'Ciudad de México',
            addressCountry: 'MX',
        },
        geo: hasCoords ? {
            '@type': 'GeoCoordinates',
            latitude: latNum,
            longitude: lngNum,
        } : undefined,
        telephone: restaurant.phone,
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://comeweb.mx'}/lugares/${slug}`,
        servesCuisine: restaurant.category,
        starRating: {
            '@type': 'Rating',
            ratingValue: restaurant.rating,
        },
    };

    return (
        <div className={styles.profileWrapper}>
            <Script
                id="restaurant-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Hero Section */}
            <div className={styles.hero}>
                <img src={restaurant.image} alt={restaurant.name} className={styles.heroImage} />
                <div className={styles.heroOverlay} />
            </div>

            <div className={styles.contentContainer}>
                {/* Main Header Card */}
                <header className={styles.mainHeader}>
                    <div className={styles.category}>{restaurant.category}</div>
                    <h1 className={styles.name}>{restaurant.name}</h1>
                    
                    <div className={styles.badges}>
                        <div className={styles.rating}>
                            <Star color="#f5c518" fill="#f5c518" size={18} /> {restaurant.rating}
                        </div>

                        {restaurant.isMichelin && (
                            <div className={styles.michelinStars}>
                                <img src="/michelin-star.png" alt="Michelin" className={styles.michelinIcon} />
                                <span>{restaurant.michelinStars || 1} Estrellas Michelin</span>
                            </div>
                        )}

                        <div className={styles.addressRow}>
                            <MapPin color="var(--primary)" size={18} />
                            {restaurant.address}
                        </div>
                    </div>
                </header>

                <div className={styles.grid}>
                    {/* Main Content Column */}
                    <main className={styles.mainColumn}>
                        {/* Featured In Guides Section */}
                        {(restaurant as any).featuredInGuides && (restaurant as any).featuredInGuides.length > 0 && (
                            <section className={styles.extraSection}>
                                <h2 className={styles.sectionHeading}>Aparece en estas guías</h2>
                                <div className={styles.guidesGrid}>
                                    {(restaurant as any).featuredInGuides.map((guide: any) => (
                                        <Link key={guide.id} href={`/guias/${guide.slug}`} className={styles.guideMiniCard}>
                                            <div className={styles.guideMiniThumb}>
                                                <img src={guide.heroImage || "/news-placeholder.jpg"} alt={guide.title} />
                                            </div>
                                            <div className={styles.guideMiniInfo}>
                                                <h3>{guide.title}</h3>
                                                <div className={styles.guideMiniMeta}>
                                                    <BookOpen size={14} /> Artículo Interactivo
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className={styles.aboutSection}>
                            <h2>Experiencia Gastronómica</h2>
                            <p className={styles.description}>
                                {restaurant.description || "Una propuesta culinaria excepcional que redefine los sabores tradicionales con técnicas contemporáneas de vanguardia."}
                            </p>

                            {restaurant.chef && (
                                <div className={styles.chefSection}>
                                    <span className={styles.chefLabel}>Liderado por</span>
                                    <Link href={`/chefs/${slugify(restaurant.chef)}`} className={styles.chefLink}>
                                        <div className={styles.chefName}>{restaurant.chef}</div>
                                    </Link>
                                    <p style={{ marginTop: '1rem', color: '#666' }}>
                                        Visionario de la cocina {restaurant.category.toLowerCase()}, cuya pasión por los ingredientes locales ha posicionado a {restaurant.name} como un referente internacional.
                                    </p>
                                </div>
                            )}

                            {restaurant.signatureDishes && restaurant.signatureDishes.length > 0 && (
                                <div className={styles.signatureSection}>
                                    <h3>Platillos Insignia</h3>
                                    <div className={styles.dishList}>
                                        {restaurant.signatureDishes.map((dish: string, idx: number) => (
                                            <div key={idx} className={styles.dishItem}>
                                                {dish}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Related Articles Section */}
                        {relatedArticles.length > 0 && (
                            <section className={styles.extraSection}>
                                <h2 className={styles.sectionHeading}>Crónicas Relacionadas</h2>
                                <div className={styles.articlesGrid}>
                                    {relatedArticles.map((article: any) => (
                                        <Link key={article.id} href={`/noticias/${article.slug}`} className={styles.articleCard}>
                                            <div className={styles.articleThumb}>
                                                <img src={article.featuredImage?.node?.sourceUrl || "/news-placeholder.jpg"} alt={article.title} />
                                            </div>
                                            <div className={styles.articleInfo}>
                                                <h3>{article.title}</h3>
                                                <div className={styles.articleMeta}>
                                                    {new Date(article.date).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Similar Places / Listas */}
                        {similarPlaces.length > 0 && (
                            <section className={styles.extraSection}>
                                <h2 className={styles.sectionHeading}>Más en {restaurant.category}</h2>
                                <div className={styles.similarGrid}>
                                    {similarPlaces.map((place: any) => (
                                        <Link key={place.id} href={`/lugares/${slugify(place.restaurantName || place.name)}`} className={styles.similarCard}>
                                            <img src={place.image || "/placeholder-restaurant.jpg"} alt={place.name} />
                                            <div className={styles.similarOverlay}>
                                                <h4>{place.name}</h4>
                                                <span>{place.rating} ★</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </main>

                    {/* Sidebar Column */}
                    <aside className={styles.sidebar}>
                        <div className={styles.mapCard}>
                            <h3>Ubicación</h3>
                            <div className={styles.mapWrapper}>
                                {hasCoords ? (
                                    <SinglePlaceMapWrapper lat={latNum} lng={lngNum} name={restaurant.name} />
                                ) : (
                                    <div className={styles.mapPlaceholder}>
                                        <MapPin size={32} strokeWidth={1} />
                                        <p>Mapa no disponible</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className={styles.contactInfo}>
                                {restaurant.phone && (
                                    <a href={`tel:${restaurant.phone}`} className={styles.contactLink}>
                                        <Phone color="var(--primary)" size={18} /> {restaurant.phone}
                                    </a>
                                )}
                                {restaurant.website && (
                                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                                        <Globe color="var(--primary)" size={18} /> Web Oficial
                                    </a>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', justifyContent: 'center', fontSize: '1.4rem' }}>
                                {restaurant.socials?.instagram && (
                                    <a href={restaurant.socials.instagram} target="_blank" rel="noreferrer" style={{ color: '#E1306C' }}><FaInstagram size={24} /></a>
                                )}
                                {restaurant.socials?.facebook && (
                                    <a href={restaurant.socials.facebook} target="_blank" rel="noreferrer" style={{ color: '#4267B2' }}><FaFacebookF size={24} /></a>
                                )}
                                {restaurant.socials?.twitter && (
                                    <a href={restaurant.socials.twitter} target="_blank" rel="noreferrer" style={{ color: '#1DA1F2' }}><FaTwitter size={24} /></a>
                                )}
                            </div>
                        </div>

                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <button className={styles.actionBtn}>
                                <Navigation style={{ marginRight: '8px' }} size={18} /> Cómo Llegar
                            </button>
                        </a>

                        <Link href={`/lugares/menu/${restaurant.id}`} style={{ textDecoration: 'none' }}>
                            <button className={styles.actionBtn} style={{ background: '#fff', color: '#000', border: '2px solid #000', marginTop: '-1rem' }}>
                                <UtensilsCrossed style={{ marginRight: '8px' }} size={18} /> Menú Digital
                            </button>
                        </Link>
                    </aside>
                </div>
            </div>
        </div>
    );
}
