"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FaFacebookF, FaInstagram, FaSyncAlt, FaTiktok } from "react-icons/fa";
import styles from "./SocialConnections.module.css";

type Platform = "instagram" | "tiktok" | "facebook";

const PLATFORMS: Array<{ id: Platform; name: string; icon: React.ReactNode; description: string }> = [
  { id: "instagram", name: "Instagram", icon: <FaInstagram />, description: "Importa Reels de una cuenta profesional autorizada." },
  { id: "tiktok", name: "TikTok", icon: <FaTiktok />, description: "Importa los videos públicos recientes mediante Display API." },
  { id: "facebook", name: "Facebook", icon: <FaFacebookF />, description: "Importa videos de la página que administra la cuenta." },
];

export default function SocialConnections({ entityId, entityType = "restaurant", status = {} }: {
  entityId: string;
  entityType?: "restaurant" | "chef";
  status?: Record<string, { connected?: boolean; count?: number; lastSyncAt?: string; error?: string | null }>;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState<Platform | null>(null);
  const [message, setMessage] = useState("");

  const authHeaders = async () => {
    if (!user) throw new Error("Inicia sesión nuevamente.");
    return { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" };
  };

  const connect = async (platform: Platform) => {
    setBusy(platform); setMessage("");
    try {
      const response = await fetch("/api/social/connect", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ platform, entityType, entityId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo conectar.");
      window.location.assign(data.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo conectar.");
      setBusy(null);
    }
  };

  const sync = async (platform: Platform) => {
    setBusy(platform); setMessage("");
    try {
      const response = await fetch("/api/social/sync", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ platform, entityType, entityId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo sincronizar.");
      setMessage(`${data.count} videos sincronizados. Recarga para verlos.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo sincronizar.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={styles.grid}>
      {PLATFORMS.map((platform) => {
        const current = status[platform.id];
        return (
          <article className={styles.card} key={platform.id}>
            <div className={styles.icon}>{platform.icon}</div>
            <div className={styles.copy}>
              <div className={styles.titleRow}><h3>{platform.name}</h3><span className={current?.connected ? styles.connected : styles.pending}>{current?.connected ? "Conectado" : "Sin conectar"}</span></div>
              <p>{platform.description}</p>
              {current?.connected && <small>{current.count || 0} videos · última sincronización {current.lastSyncAt ? new Date(current.lastSyncAt).toLocaleString("es-MX") : "pendiente"}</small>}
              {current?.error && <small className={styles.error}>Error: {current.error}. Reconecta la cuenta si el acceso fue revocado.</small>}
            </div>
            {current?.connected ? (
              <button type="button" onClick={() => sync(platform.id)} disabled={busy === platform.id}><FaSyncAlt /> {busy === platform.id ? "Sincronizando" : "Sincronizar"}</button>
            ) : (
              <button type="button" onClick={() => connect(platform.id)} disabled={busy === platform.id}>{busy === platform.id ? "Abriendo…" : "Conectar"}</button>
            )}
          </article>
        );
      })}
      {message && <p className={styles.message} role="status">{message}</p>}
    </div>
  );
}
