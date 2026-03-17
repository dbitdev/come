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

export default function Home() {
  const [popularPlaces, setPopularPlaces] = useState<any[]>([]);
  const [michelinPlaces, setMichelinPlaces] = useState<any[]>([]);
  const [newestPlaces, setNewestPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        let firestorePlaces: any[] = [];
        if (db) {
          const q = query(collection(db, "business_leads"), orderBy("createdAt", "desc"), limit(10));
          const querySnapshot = await getDocs(q);
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
        }

        const allPopular = [...firestorePlaces].slice(0, 6);
        const allMichelin = [...firestorePlaces.filter(p => p.isMichelin)].slice(0, 3);
        const allNewest = [...firestorePlaces].slice(0, 6);
        
        setPopularPlaces(allPopular);
        setMichelinPlaces(allMichelin);
        setNewestPlaces(allNewest);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
        setPopularPlaces([]);
        setMichelinPlaces([]);
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
