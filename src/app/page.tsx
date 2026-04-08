"use client";

import React, { useEffect, useState } from "react";
import Hero from "@/components/Hero";
import PlacesList from "@/components/PlacesList";
import NewsSection from "@/components/NewsSection";
import Banner from "@/components/Banner";
import HomeMap from "@/components/HomeMap";
import styles from "./page.module.css";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { Map, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [popularPlaces, setPopularPlaces] = useState<any[]>([]);
  const [michelinPlaces, setMichelinPlaces] = useState<any[]>([]);
  const [newestPlaces, setNewestPlaces] = useState<any[]>([]);
  const [featuredGuides, setFeaturedGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        let firestorePlaces: any[] = [];
        let firestoreGuides: any[] = [];

        if (db) {
          // Fetch places
          const qPlaces = query(collection(db, "business_leads"), orderBy("createdAt", "desc"), limit(10));
          const querySnapshot = await getDocs(qPlaces);
          firestorePlaces = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.restaurantName || data.name,
              category: data.category,
              rating: data.rating || 5.0,
              image: (data.menu && data.menu[0]?.image) || data.image || "/placeholder-restaurant.jpg",
              subdomain: data.subdomain,
              isFirebase: true,
              isMichelin: !!data.awards || !!data.isMichelin,
              awards: data.awards,
              address: data.address,
              phone: data.phone,
              schedule: data.schedule
            };
          });

          // Fetch guides
          const qGuides = query(collection(db, "guides"), orderBy("createdAt", "desc"), limit(4));
          const guidesSnapshot = await getDocs(qGuides);
          firestoreGuides = guidesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }

        const allPopular = [...firestorePlaces].slice(0, 6);
        const allMichelin = [...firestorePlaces.filter(p => p.isMichelin)].slice(0, 3);
        const allNewest = [...firestorePlaces];

        // Add fallback guide if none exist in DB for demo/visibility
        if (firestoreGuides.length === 0) {
          firestoreGuides = [
            {
              id: 'hamburguesas-cdmx',
              slug: 'mejores-hamburguesas-cdmx',
              title: 'Explora Monterrey: Las Joyas Ocultas',
              description: 'Una selección exclusiva de los lugares más auténticos de la ciudad.',
              heroImage: 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=800&q=80',
              authorName: 'Redacción Come',
              stops: [{}, {}, {}]
            }
          ];
        }

        setPopularPlaces(allPopular);
        setMichelinPlaces(allMichelin);
        setNewestPlaces(allNewest);
        setFeaturedGuides(firestoreGuides);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Hero />

        {newestPlaces.length > 0 && (
          <PlacesList
            title="Lo Nuevo"
            subtitle="Las últimas incorporaciones a nuestra guía"
            places={newestPlaces}
            isCarousel={true}
          />
        )}

        <PlacesList
          title="Dónde comer"
          subtitle="Los lugares más populares y cercanos a ti"
          places={popularPlaces}
          isCarousel={true}
        />

        <section className={styles.mapHighlightSection}>
          <div className={styles.container}>
            <div className={styles.mapGrid}>
              <div className={styles.mapInfo}>
                <div className={styles.tag}>Interactivo</div>
                <h2 className={styles.mapTitle}>Explora la Ciudad</h2>
                <p className={styles.mapText}>
                  Encuentra los mejores restaurantes cerca de ti en nuestro mapa interactivo.
                  Filtra por categorías y descubre joyas ocultas.
                </p>
                <div className={styles.mapStats}>
                  <div className={styles.stat}>
                    <strong>+50</strong>
                    <span>Lugares</span>
                  </div>
                  <div className={styles.stat}>
                    <strong>10</strong>
                    <span>Zonas</span>
                  </div>
                </div>
              </div>
              <div className={styles.mapWrapper}>
                <HomeMap />
              </div>
            </div>
          </div>
        </section>

        {/* Come Mapas (Guides) Section */}
        {featuredGuides.length > 0 && (
          <section className={styles.guidesSection}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <div className={styles.titleInfo}>
                  <h2 className={styles.sectionTitle}>Come Mapas</h2>
                  <p className={styles.sectionSubtitle}>Rutas culinarias con mapas interactivos</p>
                </div>
                <Link href="/guias" className={styles.viewAllLink}>
                  Ver todas <ChevronRight size={16} />
                </Link>
              </div>
              <div className={styles.guidesGrid}>
                {featuredGuides.map((guide) => (
                  <Link key={guide.id} href={`/guias/${guide.slug}`} className={styles.guideCard}>
                    <div className={styles.guideImage}>
                      <img src={guide.heroImage || "/news-placeholder.jpg"} alt={guide.title} />
                      <div className={styles.guideOverlay}>
                        <div className={styles.guideStats}>
                          <span><Map size={14} /> {guide.stops?.length || 0} Paradas</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.guideContent}>
                      <h3>{guide.title}</h3>
                      <div className={styles.guideAuthor}>Por {guide.authorName}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <PlacesList
          title="Restaurantes Exclusivos"
          subtitle="Galardonados con estrella Michelin o reconocimientos"
          places={michelinPlaces}
          showMichelin={true}
        />

        <NewsSection />


        <Banner />
      </main>
    </div>
  );
}
