"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { ChevronRight, MapPin, Search, Star, Utensils } from "lucide-react";
import { db } from "@/lib/firebase";
import { slugify } from "@/lib/utils";
import RetratoChef from "@/components/RetratoChef";
import styles from "./ChefsPage.module.css";

type Chef = {
  id: string;
  nombre: string;
  especialidad: string;
  restaurante: string;
  imagen?: string;
  estrellas: number;
  bio?: string;
  ubicacion?: string;
  logroClave?: string;
};

export default function ChefsPage() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [termino, setTermino] = useState("");
  const [cargando, setCargando] = useState(true);

  // Antes esta página mostraba una lista fija escrita en el código: nombres que
  // no estaban en la base y fotos que ya no existen. Ahora lee Firestore.
  useEffect(() => {
    (async () => {
      if (!db) return setCargando(false);
      try {
        const snapshot = await getDocs(collection(db, "chefs"));
        setChefs(
          snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              nombre: d.name || d.nombre || "Chef",
              especialidad: d.specialty || d.especialidad || "Cocina mexicana",
              restaurante: d.restaurant || d.restaurante || "",
              imagen: d.image || d.photoUrl || undefined,
              estrellas: Number(d.estrellas ?? d.michelinStars) || 0,
              bio: d.bio || undefined,
              ubicacion: d.ubicacion || d.estado || undefined,
              logroClave: d.logroClave || d.awards || undefined,
            };
          })
        );
      } catch {
        setChefs([]);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const visibles = useMemo(() => {
    const aguja = termino.trim().toLowerCase();
    if (!aguja) return chefs;
    return chefs.filter((c) =>
      `${c.nombre} ${c.restaurante} ${c.especialidad} ${c.ubicacion ?? ""}`.toLowerCase().includes(aguja)
    );
  }, [chefs, termino]);

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Maestros de la Cocina</h1>
          <p>Descubre a los visionarios que están redefiniendo el panorama gastronómico de México.</p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.searchBar}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar chef, restaurante o ciudad…"
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            aria-label="Buscar chef"
          />
        </div>

        {cargando ? (
          <div className={styles.estado}>Cargando chefs…</div>
        ) : (
          <div className={styles.chefsGrid}>
            {visibles.map((chef) => (
              <div key={chef.id} className={styles.chefCard}>
                <div className={styles.imageWrapper}>
                  <RetratoChef src={chef.imagen} nombre={chef.nombre} />
                  {chef.estrellas > 0 && (
                    <div className={styles.starsBadge}>
                      <Star size={12} fill="currentColor" /> {chef.estrellas}
                    </div>
                  )}
                </div>
                <div className={styles.info}>
                  <div className={styles.specialty}>{chef.especialidad}</div>
                  <h3 className={styles.name}>{chef.nombre}</h3>
                  {chef.restaurante && (
                    <div className={styles.restaurant}>
                      <Utensils size={14} /> <span>{chef.restaurante}</span>
                    </div>
                  )}
                  {chef.ubicacion && (
                    <div className={styles.restaurant}>
                      <MapPin size={14} /> <span>{chef.ubicacion}</span>
                    </div>
                  )}
                  <Link href={`/chefs/${slugify(chef.nombre)}`} className={styles.viewBtn}>
                    Ver Perfil <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!cargando && visibles.length === 0 && (
          <div className={styles.estado}>No encontramos chefs con esa búsqueda.</div>
        )}
      </main>
    </div>
  );
}
