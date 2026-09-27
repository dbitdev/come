"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  FaTimes,
  FaPlay,
  FaPause,
  FaVolumeMute,
  FaVolumeUp,
  FaHeart,
  FaShare,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaMusic,
  FaInstagram,
  FaTiktok,
  FaFacebookF,
  FaExternalLinkAlt,
} from "react-icons/fa";
import type { SocialFeedItem } from "@/lib/feedSocial";
import styles from "./VideoModalPlayer.module.css";

interface Props {
  item: SocialFeedItem | null;
  items: SocialFeedItem[];
  onClose: () => void;
  onSelectVideo: (item: SocialFeedItem) => void;
}

export default function VideoModalPlayer({ item, items, onClose, onSelectVideo }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Encontrar índice actual
  const currentIndex = items.findIndex((i) => i.id === item?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasPrev) onSelectVideo(items[currentIndex - 1]);
      else if (e.key === "ArrowRight" && hasNext) onSelectVideo(items[currentIndex + 1]);
      else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, hasPrev, hasNext, onClose, onSelectVideo, items]);

  useEffect(() => {
    // Reset state al cambiar de video
    setProgress(0);
    setIsPlaying(true);
    setLiked(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [item?.id]);

  if (!item) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowIndicator(true);
    setTimeout(() => setShowIndicator(false), 500);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nuevoMute = !videoRef.current.muted;
    videoRef.current.muted = nuevoMute;
    setIsMuted(nuevoMute);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: `${item.titulo} | Come`,
      text: `${item.titulo} - ${item.autor}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Ignorar si cancela
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Botón Anterior */}
        <button
          type="button"
          className={`${styles.navBtn} ${styles.prevBtn}`}
          onClick={() => hasPrev && onSelectVideo(items[currentIndex - 1])}
          disabled={!hasPrev}
          aria-label="Video anterior"
        >
          <FaChevronLeft size={18} />
        </button>

        {/* Reproductor Vertical 9:16 */}
        <div className={styles.playerWrapper}>
          {item.videoUrl ? (
            <video
              ref={videoRef}
              src={item.videoUrl}
              poster={item.miniatura}
              className={styles.videoElement}
              playsInline
              autoPlay
              loop
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onClick={togglePlay}
            />
          ) : item.embedUrl ? (
            <iframe
              src={item.embedUrl}
              title={item.titulo}
              className={styles.embedElement}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : null}

          {/* Degradados */}
          <div className={styles.gradientTop} />
          <div className={styles.gradientBottom} />

          {/* Indicador de Play/Pause central */}
          {item.videoUrl && showIndicator && (
            <div className={styles.playPauseIndicator}>
              {isPlaying ? <FaPlay /> : <FaPause />}
            </div>
          )}

          {/* Barra superior */}
          <div className={styles.headerBar}>
            <div
              className={`${styles.platformPill} ${
                item.red === "instagram"
                  ? styles.pillIg
                  : item.red === "tiktok"
                  ? styles.pillTt
                  : styles.pillFb
              }`}
            >
              {item.red === "instagram" && <FaInstagram size={12} />}
              {item.red === "tiktok" && <FaTiktok size={11} />}
              {item.red === "facebook" && <FaFacebookF size={11} />}
              <span>{item.red === "instagram" ? "Reel" : item.red === "tiktok" ? "TikTok" : "Facebook"}</span>
            </div>

            <div className={styles.headerActions}>
              {item.videoUrl && (
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={toggleMute}
                  aria-label={isMuted ? "Activar sonido" : "Silenciar"}
                >
                  {isMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
                </button>
              )}
              <button
                type="button"
                className={styles.iconBtn}
                onClick={onClose}
                aria-label="Cerrar video"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          {/* Barra de acciones lateral derecha */}
          <div className={styles.rightSidebar}>
            {/* Botón Like */}
            <button
              type="button"
              className={styles.actionItem}
              onClick={(e) => {
                e.stopPropagation();
                setLiked(!liked);
              }}
              aria-label="Me gusta"
            >
              <div className={`${styles.actionCircle} ${liked ? styles.actionCircleActive : ""}`}>
                <FaHeart />
              </div>
              <span className={styles.actionLabel}>
                {liked ? "14.3K" : item.likes || item.vistas}
              </span>
            </button>

            {/* Botón Compartir */}
            <button
              type="button"
              className={styles.actionItem}
              onClick={handleShare}
              aria-label="Compartir"
            >
              <div className={styles.actionCircle}>
                <FaShare />
              </div>
              <span className={styles.actionLabel}>{copied ? "¡Copiado!" : "Compartir"}</span>
            </button>

            {/* Enlace opcional a red social externa si el usuario lo desea */}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionItem}
              onClick={(e) => e.stopPropagation()}
              title="Abrir en red social"
            >
              <div className={styles.actionCircle}>
                <FaExternalLinkAlt size={13} />
              </div>
              <span className={styles.actionLabel}>Ver post</span>
            </a>
          </div>

          {/* Información inferior */}
          <div className={styles.bottomInfo}>
            <div className={styles.authorRow}>
              <span className={styles.authorName}>{item.autor}</span>
              <FaCheckCircle size={13} style={{ color: "#20d5ec" }} />
              <span className={styles.authorHandle}>{item.usuario}</span>
            </div>

            <p className={styles.caption}>{item.titulo}</p>

            <div className={styles.audioRow}>
              <FaMusic size={11} />
              <span>{item.audioTitulo || "Sonido original · Gastronomía Come"}</span>
            </div>
          </div>

          {/* Barra de progreso interactiva */}
          {item.videoUrl && (
            <div
              className={styles.progressContainer}
              onClick={(e) => {
                e.stopPropagation();
                if (!videoRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                videoRef.current.currentTime = pos * (videoRef.current.duration || 1);
              }}
            >
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* Botón Siguiente */}
        <button
          type="button"
          className={`${styles.navBtn} ${styles.nextBtn}`}
          onClick={() => hasNext && onSelectVideo(items[currentIndex + 1])}
          disabled={!hasNext}
          aria-label="Video siguiente"
        >
          <FaChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
