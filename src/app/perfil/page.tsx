"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  ArrowRight,
  Building2,
  ChefHat,
  Clock,
  LogOut,
  Mail,
  MapPin,
  Plus,
  Star,
  Store,
  Utensils,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { slugify } from "@/lib/utils";
import styles from "./profile.module.css";

type Negocio = {
  id: string;
  nombre: string;
  categoria: string;
  imagen?: string;
  estado: string;
  direccion?: string;
  platillos: number;
};

export default function PerfilPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    (async () => {
      if (!user || !db) return setCargando(false);
      try {
        const snapshot = await getDocs(query(collection(db, "come"), where("userId", "==", user.uid)));
        setNegocios(
          snapshot.docs.map((doc) => {
            const d = doc.data();
            const menu = Array.isArray(d.menu) ? d.menu : [];
            return {
              id: doc.id,
              nombre: d.restaurantName || d.name || "Mi negocio",
              categoria: d.category || "Cocina mexicana",
              imagen: d.image || menu[0]?.image,
              estado: d.status === "published" ? "Publicado" : "En revisión",
              direccion: d.address,
              platillos: menu.length,
            };
          })
        );
      } catch {
        setNegocios([]);
      } finally {
        setCargando(false);
      }
    })();
  }, [user]);

  const nombre = useMemo(() => user?.displayName || user?.email?.split("@")[0] || "Invitado", [user]);
  const inicial = nombre.trim().charAt(0).toUpperCase();
  const desde = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("es-MX", { year: "numeric", month: "long" })
    : null;

  if (loading || !user) return <main className={styles.estado}>Cargando tu perfil…</main>;

  return (
    <main className={styles.page}>
      {/* Encabezado editorial, en la línea del resto del sitio */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.avatar} aria-hidden="true">
            {inicial}
          </div>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>TU CUENTA</span>
            <h1>{nombre}</h1>
            <div className={styles.heroMeta}>
              <span>
                <Mail size={15} /> {user.email}
              </span>
              {desde && (
                <span>
                  <Clock size={15} /> Miembro desde {desde}
                </span>
              )}
            </div>
          </div>
          <button className={styles.logout} onClick={() => auth && signOut(auth)}>
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </header>

      <div className={styles.body}>
        {/* Accesos */}
        <section className={styles.shortcuts}>
          <Link href="/restaurantes" className={styles.shortcut}>
            <Utensils size={20} />
            <b>Explorar</b>
            <small>Restaurantes y lugares</small>
          </Link>
          <Link href="/guias" className={styles.shortcut}>
            <MapPin size={20} />
            <b>Guías</b>
            <small>Rutas para salir a comer</small>
          </Link>
          <Link href="/nomina-lugar" className={styles.shortcut}>
            <Store size={20} />
            <b>Nominar</b>
            <small>Propón un lugar</small>
          </Link>
          <Link href="/nomina-chef" className={styles.shortcut}>
            <ChefHat size={20} />
            <b>Nominar chef</b>
            <small>Propón a quien cocina</small>
          </Link>
        </section>

        {/* Negocios del usuario */}
        <section className={styles.block}>
          <div className={styles.blockHead}>
            <div>
              <span className={styles.eyebrow}>TUS NEGOCIOS</span>
              <h2>Lo que administras en Come</h2>
            </div>
            <Link href="/registra-negocio" className={styles.cta}>
              <Plus size={17} /> Registrar negocio
            </Link>
          </div>

          {cargando ? (
            <div className={styles.placeholder}>Buscando tus negocios…</div>
          ) : negocios.length === 0 ? (
            <div className={styles.placeholder}>
              <Building2 size={30} />
              <p>Todavía no registras ningún negocio.</p>
              <Link href="/registra-negocio" className={styles.cta}>
                Registrar el primero <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {negocios.map((negocio) => (
                <article key={negocio.id} className={styles.card}>
                  <div className={styles.cardPhoto}>
                    {negocio.imagen ? (
                      <img src={negocio.imagen} alt={negocio.nombre} />
                    ) : (
                      <span aria-hidden="true">{negocio.nombre.charAt(0)}</span>
                    )}
                    <span
                      className={negocio.estado === "Publicado" ? styles.badgeOk : styles.badgePending}
                    >
                      {negocio.estado}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <span className={styles.cardCategory}>{negocio.categoria.toUpperCase()}</span>
                    <h3>{negocio.nombre}</h3>
                    {negocio.direccion && (
                      <p>
                        <MapPin size={13} /> {negocio.direccion}
                      </p>
                    )}
                    <p>
                      <Utensils size={13} />{" "}
                      {negocio.platillos > 0
                        ? `${negocio.platillos} platillos en el menú`
                        : "Sin menú cargado"}
                    </p>
                    <div className={styles.cardActions}>
                      <Link href={`/gestiona-negocio/${negocio.id}`}>Gestionar</Link>
                      {negocio.estado === "Publicado" && (
                        <Link href={`/lugares/${slugify(negocio.nombre)}`} className={styles.cardGhost}>
                          Ver ficha
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Favoritos: todavía no hay sistema de guardado */}
        <section className={styles.block}>
          <div className={styles.blockHead}>
            <div>
              <span className={styles.eyebrow}>GUARDADOS</span>
              <h2>Tus favoritos</h2>
            </div>
          </div>
          <div className={styles.placeholder}>
            <Star size={30} />
            <p>Guardar lugares llegará pronto. Mientras tanto, explora el directorio.</p>
            <Link href="/restaurantes" className={styles.cta}>
              Ver restaurantes <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
