import Hero from "@/components/Hero";
import PlacesList from "@/components/PlacesList";
import NewsSection from "@/components/NewsSection";
import Banner from "@/components/Banner";
import HomeMap from "@/components/HomeMap";
import styles from "./page.module.css";
import { restaurantsData } from "@/data/mockData";

export default function Home() {
  const popularPlaces = restaurantsData.filter(r => !r.isMichelin).slice(0, 6);
  const michelinPlaces = restaurantsData.filter(r => r.isMichelin).slice(0, 3);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Hero />
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
          subtitle="Galardonados con estrella Michelin"
          places={michelinPlaces}
          showMichelin={true}
        />
        <NewsSection />
        <Banner />
      </main>
    </div>
  );
}
