"use client";

import React, { useRef, useState } from "react";
import { FaInstagram, FaTiktok, FaFacebookF, FaPlay, FaChevronLeft, FaChevronRight, FaFire } from "react-icons/fa";
import type { RedSocial, SocialFeedItem } from "@/lib/feedSocial";
import VideoModalPlayer from "./VideoModalPlayer";
import styles from "./FeedSocialCarousel.module.css";

interface Props {
  titulo?: string;
  subtitulo?: string;
  items: SocialFeedItem[];
  cuentas?: Array<{ red: RedSocial; usuario: string; url: string }>;
}

export default function FeedSocialCarousel({
  titulo = "En redes sociales",
  subtitulo = "VIDEOS Y REELS DESTACADOS",
  items,
  cuentas = [],
}: Props) {
  const [filtro, setFiltro] = useState<"todos" | RedSocial>("todos");
  const [videoActivo, setVideoActivo] = useState<SocialFeedItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtrados = items.filter((item) => {
    if (filtro === "todos") return true;
    return item.red === filtro;
  });

  const scroll = (direccion: "izq" | "der") => {
    if (!scrollRef.current) return;
    const offset = direccion === "izq" ? -260 : 260;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (!items || items.length === 0) return null;

  return (
    <>
      <section className={styles.container} aria-label="Feed de redes sociales">
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <span className={styles.tagline}>{subtitulo}</span>
            <h2 className={styles.heading}>
              <FaFire style={{ color: "#e6683c", fontSize: "1.2rem" }} />
              {titulo}
            </h2>
          </div>

          <div className={styles.controls}>
            <div className={styles.filterTabs}>
              <button
                type="button"
                className={`${styles.filterBtn} ${filtro === "todos" ? styles.filterBtnActive : ""}`}
                onClick={() => setFiltro("todos")}
              >
                Todos
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${filtro === "instagram" ? styles.filterBtnActive : ""}`}
                onClick={() => setFiltro("instagram")}
              >
                <FaInstagram size={13} style={{ color: "#dc2743" }} /> Instagram
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${filtro === "tiktok" ? styles.filterBtnActive : ""}`}
                onClick={() => setFiltro("tiktok")}
              >
                <FaTiktok size={11} /> TikTok
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${filtro === "facebook" ? styles.filterBtnActive : ""}`}
                onClick={() => setFiltro("facebook")}
              >
                <FaFacebookF size={11} style={{ color: "#1877f2" }} /> Facebook
              </button>
            </div>

            <div className={styles.navArrows}>
              <button
                type="button"
                className={styles.arrowBtn}
                onClick={() => scroll("izq")}
                aria-label="Anterior"
              >
                <FaChevronLeft size={13} />
              </button>
              <button
                type="button"
                className={styles.arrowBtn}
                onClick={() => scroll("der")}
                aria-label="Siguiente"
              >
                <FaChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Carrusel de videos reproducibles en sitio */}
        <div className={styles.carousel} ref={scrollRef}>
          {filtrados.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.card}
              onClick={() => setVideoActivo(item)}
              aria-label={`Ver video: ${item.titulo}`}
            >
              <img src={item.miniatura} alt={item.titulo} className={styles.cardImage} />
              <div className={styles.cardGradient} />

              <div className={styles.cardTop}>
                <span
                  className={`${styles.networkBadge} ${
                    item.red === "instagram"
                      ? styles.networkBadgeIg
                      : item.red === "tiktok"
                      ? styles.networkBadgeTt
                      : styles.networkBadgeFb
                  }`}
                >
                  {item.red === "instagram" && <FaInstagram size={12} />}
                  {item.red === "tiktok" && <FaTiktok size={11} />}
                  {item.red === "facebook" && <FaFacebookF size={11} />}
                  {item.red === "instagram" ? "Reel" : item.red === "tiktok" ? "TikTok" : "Facebook"}
                </span>

                {item.vistas && (
                  <span className={styles.viewsCount}>
                    <FaPlay size={9} />
                    {item.vistas}
                  </span>
                )}
              </div>

              <div className={styles.playOverlay}>
                <FaPlay size={16} style={{ marginLeft: "2px" }} />
              </div>

              <div className={styles.cardBottom}>
                <span className={styles.authorHandle}>{item.usuario}</span>
                <p className={styles.cardCaption}>{item.titulo}</p>
              </div>
            </button>
          ))}
        </div>

        {cuentas.length > 0 && (
          <div className={styles.footerActions}>
            <span style={{ fontSize: "0.85rem", color: "#5d6c64", fontWeight: 500 }}>
              Sigue las novedades oficiales:
            </span>
            <div className={styles.socialProfileLinks}>
              {cuentas.map((cta) => (
                <a
                  key={cta.red + cta.usuario}
                  href={cta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.socialProfileBtn} ${
                    cta.red === "instagram"
                      ? styles.btnIg
                      : cta.red === "tiktok"
                      ? styles.btnTt
                      : styles.btnFb
                  }`}
                >
                  {cta.red === "instagram" && <FaInstagram size={14} />}
                  {cta.red === "tiktok" && <FaTiktok size={12} />}
                  {cta.red === "facebook" && <FaFacebookF size={12} />}
                  {cta.usuario}
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Reproductor de Video en Sitio (sin redirigir) */}
      <VideoModalPlayer
        item={videoActivo}
        items={filtrados}
        onClose={() => setVideoActivo(null)}
        onSelectVideo={setVideoActivo}
      />
    </>
  );
}
