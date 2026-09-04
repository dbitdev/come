"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { ArrowRight, CalendarDays, MapPin, Search, ShoppingBag, Sparkles } from "lucide-react";
import { db } from "@/lib/firebase";
import { slugify } from "@/lib/utils";
import styles from "./Hero.module.css";

type FeaturedPlace = { id: string; name: string; slug: string; image: string; category: string; rating: number };

const FALLBACK_PLACES: FeaturedPlace[] = [
  { id: "discover", name: "Sabores que cuentan historias", slug: "", image: "/hero_food_top.png", category: "Selección editorial", rating: 4.9 },
  { id: "routes", name: "Rutas para comer mejor", slug: "", image: "/hero_food_bottom.png", category: "Explora México", rating: 4.8 },
];
const QUICK_FILTERS = ["Cerca de mí", "Abierto ahora", "Mexicana", "Café", "Experiencias"];

export default function Hero() {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [places, setPlaces] = useState<FeaturedPlace[]>(FALLBACK_PLACES);

  useEffect(() => {
    let active = true;
    async function loadPlaces() {
      if (!db) return;
      try {
        const snapshot = await getDocs(query(collection(db, "come"), limit(8)));
        const loaded = snapshot.docs.map((place) => {
          const data = place.data();
          const name = data.restaurantName || data.name || "Lugar gastronómico";
          return { id: place.id, name, slug: slugify(name), image: data.image || data.menu?.[0]?.image || "", category: data.category || "Gastronomía", rating: Number(data.rating) || 4.8 };
        }).filter((place) => place.image).slice(0, 3);
        if (active && loaded.length) setPlaces(loaded);
      } catch (error) {
        console.error("No fue posible cargar los lugares destacados", error);
      }
    }
    loadPlaces();
    return () => { active = false; };
  }, []);

  const featured = useMemo(() => places[0] || FALLBACK_PLACES[0], [places]);
  const secondary = useMemo(() => places.slice(1, 3), [places]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (location.trim()) params.set("location", location.trim());
    window.location.href = `/lugares?${params.toString()}`;
  }

  function locateUser() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(() => setLocation("Cerca de mi ubicación"), () => setLocation("Ciudad de México"));
  }

  return (
    <section className={styles.hero}>
      <div className={styles.glow} />
      <div className={styles.shell}>
        <div className={styles.copy}>
          <div className={styles.eyebrow}><Sparkles size={16} /> La gastronomía de México, en un solo lugar</div>
          <h1>Encuentra algo <em>extraordinario</em> para comer.</h1>
          <p className={styles.lead}>Descubre restaurantes, chefs, mercados y rutas. Guarda tus favoritos y encuentra dónde reservar o pedir.</p>
          <form className={styles.search} onSubmit={submitSearch}>
            <label className={styles.searchField}>
              <Search size={21} /><span className={styles.srOnly}>Qué quieres comer</span>
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="¿Qué se te antoja?" />
            </label>
            <label className={styles.locationField}>
              <button type="button" onClick={locateUser} aria-label="Usar mi ubicación"><MapPin size={20} /></button>
              <span className={styles.srOnly}>Ubicación</span>
              <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Zona o ciudad" />
            </label>
            <button className={styles.submit} type="submit">Explorar <ArrowRight size={18} /></button>
          </form>
          <div className={styles.quickFilters} aria-label="Búsquedas populares">
            {QUICK_FILTERS.map((filter) => <Link key={filter} href={`/lugares?search=${encodeURIComponent(filter)}`}>{filter}</Link>)}
          </div>
          <div className={styles.actions}>
            <Link href="/mapa"><MapPin size={18} /> Explorar el mapa</Link>
            <Link href="/guias"><CalendarDays size={18} /> Planear una ruta</Link>
            <Link href="/lugares"><ShoppingBag size={18} /> Ver lugares</Link>
          </div>
        </div>
        <div className={styles.visual}>
          <Link href={featured.slug ? `/lugares/${featured.slug}` : "/lugares"} className={styles.featuredCard}>
            <img src={featured.image} alt={featured.name} />
            <div className={styles.cardShade} />
            <div className={styles.cardTop}><span>Elegido para ti</span><span>★ {featured.rating.toFixed(1)}</span></div>
            <div className={styles.cardCopy}>
              <small>{featured.category}</small><h2>{featured.name}</h2>
              <span className={styles.discover}>Descubrir <ArrowRight size={17} /></span>
            </div>
          </Link>
          <div className={styles.miniGrid}>
            {secondary.map((place) => (
              <Link key={place.id} href={place.slug ? `/lugares/${place.slug}` : "/lugares"} className={styles.miniCard}>
                <img src={place.image} alt={place.name} /><div><small>{place.category}</small><strong>{place.name}</strong></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
