import React, { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
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
    BookOpen,
    ShoppingBag
} from 'lucide-react';
import { FaInstagram, FaFacebookF, FaTwitter } from 'react-icons/fa';
import { isCanonicalPublicPlace, rutaMenu, slugify } from '@/lib/utils';
import { emparejarChefs, separarNombres } from '@/lib/vinculos';
import { traerChefs } from '@/lib/chefs';
import Link from 'next/link';
import styles from './profile.module.css';
import { searchArticles } from '@/lib/wordpress';
import { Metadata } from 'next';
import Script from 'next/script';
import FeedSocialCarousel from '@/components/FeedSocialCarousel';
import { obtenerFeedLugar } from '@/lib/feedSocial';
import type { SocialVideoSource } from '@/lib/feedSocial';
import { generateVideoJsonLd } from '@/lib/socialMedia';
import { normalizarConfig } from '@/lib/reservas';
import ReservaWidget from '@/components/reservas/ReservaWidget';

interface Restaurant {
    id: string;
    name: string;
    restaurantName?: string;
    category: string;
    image: string;
    rating: string | number;
    address?: string;
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
        tiktok?: string;
    };
    socialVideos?: SocialVideoSource[];
    lat?: number | string;
    lng?: number | string;
    imagenTarjeta?: string;
    city?: string;
    ciudad?: string;
    state?: string;
    estado?: string;
    priceRange?: string;
    menu?: Array<{name?:string;description?:string;ingredients?:string;image?:string;price?:number}>;
    userId?: string;
    reservas?: unknown;
}

// cache(): generateMetadata y la página piden el mismo lugar en cada visita;
// así la colección se lee una vez por petición y no dos.
const getRestaurant = cache(async function getRestaurant(slug: string): Promise<Restaurant | null> {
    try {
        if (!db) return null;
        const qRest = collection(db, "come");
        const querySnapshot = await getDocs(qRest);
        
        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            if (!isCanonicalPublicPlace(docSnap.id, data)) continue;
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
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const restaurant = await getRestaurant(decodeURIComponent(slug));
    
    if (!restaurant) {
    // Si la consulta a Firestore falla o tarda, esta rama es la que se sirve al
    // rastreador. Sin imagen aquí, el enlace se comparte pelón; con la estática
    // de la marca al menos siempre hay algo.
        return {
            title: "Restaurante no encontrado | Come",
            openGraph: {
                title: "Restaurantes en México | Come",
                siteName: 'Come',
                locale: 'es_MX',
                images: [{ url: '/og-come.jpg', width: 1200, height: 630, alt: 'Come' }],
            },
            twitter: { card: 'summary_large_image', images: ['/og-come.jpg'] },
        };
    }

    const title = `${restaurant.name} · ${restaurant.category} | Come`;
    const description = restaurant.description || `${restaurant.name}: ${restaurant.category.toLowerCase()} en México. Dirección, menú y cómo llegar, en Come.`;

    // `imagenTarjeta` es la foto ya recortada a 1200x630 y comprimida, generada
    // al subirla. Mandar la original hacía que WhatsApp se rindiera: las que
    // sube la redacción pesan varios MB. Si un lugar todavía no la tiene, se
    // cae a la tarjeta de marca de opengraph-image.tsx.
    const canonica = `/lugares/${slugify(restaurant.name || '')}`;
    // Si el lugar todavía no tiene su recorte, va la imagen fija de la marca:
    // una estática no puede fallar en el servidor, que es la lección de haber
    // intentado generarla al vuelo.
    const imagenCompartir = restaurant.imagenTarjeta || '/og-come.jpg';
    const imagenes = [{ url: imagenCompartir, width: 1200, height: 630, alt: restaurant.name }];
    return {
        title,
        description,
        keywords: [restaurant.name, restaurant.category, `restaurante ${restaurant.name}`, `menú ${restaurant.name}`, restaurant.city || restaurant.ciudad, restaurant.estado || restaurant.state, "Come", "ComeApp"].filter(Boolean) as string[],
        alternates: { canonical: canonica },
        openGraph: {
            title,
            description,
            url: canonica,
            siteName: 'Come',
            locale: 'es_MX',
            type: 'website',
            images: imagenes,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imagenCompartir],
        },
    };
}

export default async function RestaurantProfile({ params }: { params: Promise<{ slug: string }> }) {
    const { slug: slugParam } = await params;
    const slug = decodeURIComponent(slugParam);
    
    let restaurant: Restaurant | null = null;
    let relatedArticles: any[] = [];
    let similarPlaces: any[] = [];
    let destinoCanonico: string | null = null;

    try {
        if (!db) throw new Error("Firebase DB not initialized");

        const foundData = await getRestaurant(slug);
        if (foundData) {
            // La ruta sigue aceptando el id de Firestore para no romper enlaces
            // viejos, pero la dirección buena es la del nombre. El redirect no
            // puede ir aquí dentro: lanza una excepción propia de Next que este
            // try se tragaría, así que sólo anotamos el destino.
            const canonico = slugify(foundData.name || "");
            if (canonico && slug !== canonico) destinoCanonico = `/lugares/${canonico}`;

            restaurant = foundData;
            const name = restaurant.name;
            const id = restaurant.id;
            
            // Note: Geocoding on server is only possible if API key is in environment variables.
            // For now, we rely on existing coordinates.

            // Fetch related articles from WordPress
            relatedArticles = await searchArticles(name, 3);

            // Fetch similar places (same category, excluding current)
            const qSimilar = query(
                collection(db, "come"),
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

    if (destinoCanonico) {
        redirect(destinoCanonico);
    }

    if (!restaurant) {
        notFound();
    }

    // Los nombres salen del arreglo nuevo y, mientras no se haya migrado todo el
    // directorio, del texto libre de siempre.
    const nombresDeChef: string[] = Array.isArray((restaurant as any).chefsNombres) && (restaurant as any).chefsNombres.length
        ? (restaurant as any).chefsNombres
        : separarNombres(restaurant.chef);
    const chefsConFicha = new Map<string, string>();
    if (nombresDeChef.length > 0) {
        const todos = await traerChefs();
        const { vinculados } = emparejarChefs(nombresDeChef, todos.map(c => ({ id: c.id, name: c.name })));
        for (const v of vinculados) {
            const ficha = todos.find(c => c.id === v.id);
            if (ficha) chefsConFicha.set(v.nombre, ficha.slug);
        }
    }

    const latNum = restaurant.lat ? Number(restaurant.lat) : null;
    const lngNum = restaurant.lng ? Number(restaurant.lng) : null;
    const hasCoords = latNum !== null && lngNum !== null && !isNaN(latNum) && !isNaN(lngNum);

    const address = restaurant.address?.trim() || "";
    const googleMapsUrl = hasCoords 
        ? `https://www.google.com/maps/dir/?api=1&destination=${latNum},${lngNum}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || restaurant.name)}`;

    const ciudad = restaurant.city || restaurant.ciudad || (address.match(/Puebla/i) ? 'Puebla' : address.match(/Oaxaca/i) ? 'Oaxaca' : address.match(/CDMX|Ciudad de México/i) ? 'Ciudad de México' : undefined);
    const region = restaurant.estado || restaurant.state || ciudad;
    const rating = Number(restaurant.rating);
    const ratingCount = Number((restaurant as Restaurant & { ratingCount?: number }).ratingCount);
    const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://comeapp.com.mx'}/lugares/${slugify(restaurant.name)}`;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: restaurant.name,
        image: restaurant.image,
        description: restaurant.description,
        address: address || ciudad ? {
            '@type': 'PostalAddress',
            streetAddress: address || undefined,
            addressLocality: ciudad,
            addressRegion: region,
            addressCountry: 'MX',
        } : undefined,
        geo: hasCoords ? {
            '@type': 'GeoCoordinates',
            latitude: latNum,
            longitude: lngNum,
        } : undefined,
        telephone: restaurant.phone,
        url: canonicalUrl,
        menu: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://comeapp.com.mx'}${rutaMenu(restaurant.name, restaurant.id)}`,
        servesCuisine: restaurant.category,
        priceRange: restaurant.priceRange,
        // Le dice a Google que se puede reservar en línea desde la ficha.
        acceptsReservations: normalizarConfig(restaurant.reservas).activo ? canonicalUrl : undefined,
        aggregateRating: Number.isFinite(rating) && Number.isFinite(ratingCount) && ratingCount > 0 ? {
            '@type': 'AggregateRating',
            ratingValue: rating,
            bestRating: 5,
            ratingCount,
        } : undefined,
        sameAs: [
            restaurant.socials?.instagram,
            restaurant.socials?.facebook,
            restaurant.socials?.twitter,
            restaurant.website,
        ].filter(Boolean),
    };
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://comeapp.com.mx'}/` },
            { '@type': 'ListItem', position: 2, name: 'Restaurantes', item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://comeapp.com.mx'}/restaurantes` },
            { '@type': 'ListItem', position: 3, name: restaurant.name, item: canonicalUrl },
        ],
    };

    const feedSocial = obtenerFeedLugar({
        nombre: restaurant.name,
        imagen: restaurant.image,
        socials: restaurant.socials,
        socialVideos: restaurant.socialVideos,
    });

    const videoJsonLds = feedSocial.items.map(v => generateVideoJsonLd({
        id: v.id,
        titulo: v.titulo,
        miniatura: v.miniatura,
        autor: v.autor,
        videoUrl: v.videoUrl,
        url: v.url,
    }));

    const descripcion = restaurant.description?.trim()
        || `Una propuesta de ${restaurant.category.toLowerCase()} en ${region || 'México'}. Conócelo en Come.`;
    const michelinN = restaurant.michelinStars || 1;
    // Reservaciones: el correo interno de avisos no viaja al navegador.
    const configReservas = normalizarConfig(restaurant.reservas);
    const { correoAvisos: _correoInterno, ...configReservasPublica } = configReservas;

    return (
        <div className={styles.page}>
            <Script
                id="restaurant-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbJsonLd, ...videoJsonLds]).replace(/</g, '\\u003c') }}
            />

            {/* ── Hero: nombre sobre la foto ── */}
            <header className={styles.hero}>
                <img src={restaurant.image} alt={restaurant.name} className={styles.heroImg} />
                <div className={styles.heroScrim} />
                <div className={styles.heroInner}>
                    <nav className={styles.crumbs} aria-label="Ruta de navegación">
                        <Link href="/">Inicio</Link>
                        <span aria-hidden="true">/</span>
                        <Link href="/restaurantes">Restaurantes</Link>
                    </nav>
                    <p className={styles.heroEyebrow}>{restaurant.category}</p>
                    <h1 className={styles.heroName}>{restaurant.name}</h1>
                    <div className={styles.heroMeta}>
                        {Number.isFinite(rating) && rating > 0 && (
                            <span className={styles.metaItem}>
                                <Star size={16} fill="#f5c518" color="#f5c518" /> {rating.toFixed(1)}
                            </span>
                        )}
                        {restaurant.isMichelin && (
                            <span className={styles.metaItem}>
                                <img src="/michelin-star.png" alt="" className={styles.michelinIcon} />
                                {michelinN} {michelinN > 1 ? 'Estrellas' : 'Estrella'} Michelin
                            </span>
                        )}
                        {restaurant.priceRange && <span className={styles.metaItem}>{restaurant.priceRange}</span>}
                        {(region || address) && (
                            <span className={styles.metaItem}><MapPin size={15} /> {region || address}</span>
                        )}
                    </div>
                </div>
            </header>

            <div className={styles.shell}>
                {/* ── Columna de contenido ── */}
                <div className={styles.content}>
                    <p className={styles.lead}>{descripcion}</p>

                    {nombresDeChef.length > 0 && (
                        <section className={styles.block}>
                            <div className={styles.blockHead}>
                                <span className={styles.eyebrow}>Al frente de la cocina</span>
                                <h2>{nombresDeChef.length > 1 ? 'Cocina a cuatro manos' : 'El chef'}</h2>
                            </div>
                            <div className={styles.chefsRow}>
                                {nombresDeChef.map((nombre) => {
                                    const ficha = chefsConFicha.get(nombre);
                                    const cuerpo = (
                                        <>
                                            <div>
                                                <div className={styles.chefCardName}>{nombre}</div>
                                                <div className={styles.chefCardSub}>{restaurant.category} · {restaurant.name}</div>
                                            </div>
                                            {ficha && <span className={styles.chefCardGo}><ChevronRight size={20} /></span>}
                                        </>
                                    );
                                    return ficha ? (
                                        <Link key={nombre} href={`/chefs/${ficha}`} className={styles.chefCard}>{cuerpo}</Link>
                                    ) : (
                                        <div key={nombre} className={styles.chefCard}>{cuerpo}</div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {restaurant.signatureDishes && restaurant.signatureDishes.length > 0 && (
                        <section className={styles.block}>
                            <div className={styles.blockHead}>
                                <span className={styles.eyebrow}>La carta</span>
                                <h2>Platillos insignia</h2>
                            </div>
                            <ul className={styles.dishes}>
                                {restaurant.signatureDishes.map((dish, idx) => (
                                    <li key={idx}>{dish}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {restaurant.menu && restaurant.menu.length > 0 && (
                        <section className={styles.block}>
                            <div className={styles.blockHead}>
                                <span className={styles.eyebrow}>Destacados del menú</span>
                                <h2>Lo mejor de {restaurant.name}</h2>
                            </div>
                            <div className={styles.menuGrid}>
                                {restaurant.menu.slice(0, 4).map((item, index) => (
                                    <Link href={rutaMenu(restaurant.name, restaurant.id)} key={`${item.name}-${index}`} className={styles.menuCard}>
                                        <img src={item.image || restaurant.image} alt={item.name || 'Platillo'} />
                                        <div className={styles.menuCardBody}>
                                            <h3>{item.name || 'Platillo destacado'}</h3>
                                            <p>{item.description || item.ingredients || 'Preparado por el restaurante.'}</p>
                                            <b>Ordenar ahora</b>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <Link href={rutaMenu(restaurant.name, restaurant.id)} className={styles.blockLink}>
                                Ver el menú completo <ChevronRight size={18} />
                            </Link>
                        </section>
                    )}

                    {feedSocial.items.length > 0 && (
                        <section className={styles.block}>
                            <FeedSocialCarousel
                                titulo={`Ambiente y cocina en ${restaurant.name}`}
                                subtitulo="EN TIKTOK E INSTAGRAM"
                                items={feedSocial.items}
                                cuentas={feedSocial.cuentas}
                            />
                        </section>
                    )}

                    {(restaurant as any).featuredInGuides && (restaurant as any).featuredInGuides.length > 0 && (
                        <section className={styles.block}>
                            <div className={styles.blockHead}>
                                <span className={styles.eyebrow}>Rutas gastronómicas</span>
                                <h2>Aparece en estas guías</h2>
                            </div>
                            <div className={styles.miniList}>
                                {(restaurant as any).featuredInGuides.map((guide: any) => (
                                    <Link key={guide.id} href={`/guias/${guide.slug}`} className={styles.miniCard}>
                                        <div className={styles.miniThumb}>
                                            <img src={guide.heroImage || '/news-placeholder.jpg'} alt={guide.title} />
                                        </div>
                                        <div className={styles.miniInfo}>
                                            <h3>{guide.title}</h3>
                                            <span className={styles.miniMeta}><BookOpen size={14} /> Artículo interactivo</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {relatedArticles.length > 0 && (
                        <section className={styles.block}>
                            <div className={styles.blockHead}>
                                <span className={styles.eyebrow}>En la prensa</span>
                                <h2>Crónicas relacionadas</h2>
                            </div>
                            <div className={styles.miniList}>
                                {relatedArticles.map((article: any) => (
                                    <Link key={article.id} href={`/noticias/${article.slug}`} className={styles.miniCard}>
                                        <div className={styles.miniThumb}>
                                            <img src={article.featuredImage?.node?.sourceUrl || '/news-placeholder.jpg'} alt={article.title} />
                                        </div>
                                        <div className={styles.miniInfo}>
                                            <h3>{article.title}</h3>
                                            <span className={styles.miniMeta}>
                                                {new Date(article.date).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* ── Barra lateral con lo práctico ── */}
                <aside className={styles.aside}>
                    <div className={styles.panel}>
                        <div className={styles.panelActions}>
                            {configReservas.activo && (
                                <ReservaWidget
                                    lugarId={restaurant.id}
                                    lugarNombre={restaurant.name}
                                    config={configReservasPublica}
                                    rutaRegreso={`/lugares/${slugify(restaurant.name)}`}
                                />
                            )}
                            <Link href={rutaMenu(restaurant.name, restaurant.id)} className={styles.btnPrimary}>
                                <UtensilsCrossed size={18} /> Ver menú
                            </Link>
                            <Link href={rutaMenu(restaurant.name, restaurant.id)} className={styles.btnGhost}>
                                <ShoppingBag size={18} /> Ordenar
                            </Link>
                        </div>

                        <div className={styles.panelMap}>
                            {hasCoords ? (
                                <SinglePlaceMapWrapper lat={latNum} lng={lngNum} name={restaurant.name} />
                            ) : (
                                <div className={styles.mapPlaceholder}>
                                    <MapPin size={30} strokeWidth={1} />
                                    <p>Mapa no disponible</p>
                                </div>
                            )}
                        </div>

                        {address && (
                            <p className={styles.panelAddress}><MapPin size={17} /> {address}</p>
                        )}

                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className={styles.btnOutline}>
                            <Navigation size={16} /> Cómo llegar
                        </a>

                        {(restaurant.phone || restaurant.website) && (
                            <div className={styles.panelContacts}>
                                {restaurant.phone && (
                                    <a href={`tel:${restaurant.phone}`} className={styles.contactLink}>
                                        <Phone size={17} /> {restaurant.phone}
                                    </a>
                                )}
                                {restaurant.website && (
                                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                                        <Globe size={17} /> Sitio web oficial
                                    </a>
                                )}
                            </div>
                        )}

                        {(restaurant.socials?.instagram || restaurant.socials?.facebook || restaurant.socials?.twitter) && (
                            <div className={styles.panelSocials}>
                                {restaurant.socials?.instagram && (
                                    <a href={restaurant.socials.instagram} target="_blank" rel="noreferrer" aria-label={`Instagram de ${restaurant.name}`}><FaInstagram size={22} /></a>
                                )}
                                {restaurant.socials?.facebook && (
                                    <a href={restaurant.socials.facebook} target="_blank" rel="noreferrer" aria-label={`Facebook de ${restaurant.name}`}><FaFacebookF size={22} /></a>
                                )}
                                {restaurant.socials?.twitter && (
                                    <a href={restaurant.socials.twitter} target="_blank" rel="noreferrer" aria-label={`X de ${restaurant.name}`}><FaTwitter size={22} /></a>
                                )}
                            </div>
                        )}

                        {!restaurant.userId && (
                            <Link
                                href={`/reclamar/lugar/${restaurant.id}?nombre=${encodeURIComponent(restaurant.name)}`}
                                className={styles.claimLink}
                            >
                                ¿Administras este lugar? Reclama el perfil
                            </Link>
                        )}
                    </div>
                </aside>
            </div>

            {/* ── Banda de relacionados ── */}
            {similarPlaces.length > 0 && (
                <section className={styles.relatedBand}>
                    <div className={styles.relatedInner}>
                        <h2 className={styles.relatedTitle}>Más en {restaurant.category}</h2>
                        <div className={styles.relatedGrid}>
                            {similarPlaces.map((place: any) => (
                                <Link key={place.id} href={`/lugares/${slugify(place.restaurantName || place.name)}`} className={styles.relatedCard}>
                                    <img src={place.image || '/placeholder-restaurant.jpg'} alt={place.name} />
                                    <div className={styles.relatedOverlay}>
                                        <h4>{place.restaurantName || place.name}</h4>
                                        {place.rating && <span>{place.rating} ★</span>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
