"use client";

import { useState } from "react";
import { FaCheck, FaGlobe, FaSpinner } from "react-icons/fa";
import { auth } from "@/lib/firebase";
import styles from "./ImageImporter.module.css";

type Candidate = { url: string; source: string; alt?: string };

export default function ImageImporter({
  entityType,
  entityId,
  website,
  onImported,
}: {
  entityType: "restaurant" | "chef";
  entityId: string;
  website?: string;
  onImported: (url: string) => void;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [sourcePage, setSourcePage] = useState(website || "");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const token = async () => {
    const user = auth?.currentUser;
    if (!user) throw new Error("Inicia sesión de nuevo para usar el importador.");
    return user.getIdToken();
  };

  const discover = async () => {
    setLoading(true); setMessage(null); setCandidates([]);
    try {
      const response = await fetch("/api/admin/images/discover", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ entityType, entityId, website }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se encontraron imágenes.");
      setSourcePage(data.website);
      setCandidates(data.candidates || []);
      setMessage(data.candidates?.length ? "Revisa la procedencia y elige la portada correcta." : "El sitio no publica imágenes reutilizables en sus metadatos.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo revisar el sitio.");
    } finally { setLoading(false); }
  };

  const importImage = async (candidate: Candidate) => {
    setImporting(candidate.url); setMessage(null);
    try {
      const response = await fetch("/api/admin/images/import", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ entityType, entityId, imageUrl: candidate.url, sourcePage, sourceType: candidate.source }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo importar la imagen.");
      onImported(data.image);
      setMessage("Imagen copiada a Come y aplicada a la ficha.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo importar la imagen.");
    } finally { setImporting(null); }
  };

  return (
    <section className={styles.box}>
      <div className={styles.heading}>
        <div><strong>Importar desde la web oficial</strong><small>Obtiene candidatos; nada cambia sin tu aprobación.</small></div>
        <button type="button" onClick={discover} disabled={loading || !website}>
          {loading ? <FaSpinner className={styles.spin} /> : <FaGlobe />} {loading ? "Buscando…" : "Buscar imágenes"}
        </button>
      </div>
      {!website && <p className={styles.message}>Guarda primero el sitio web oficial de esta ficha.</p>}
      {message && <p className={styles.message}>{message}</p>}
      {candidates.length > 0 && (
        <div className={styles.grid}>
          {candidates.map(candidate => (
            <article key={candidate.url}>
              <img src={candidate.url} alt={candidate.alt || "Candidato encontrado en el sitio oficial"} />
              <div><span>{candidate.source}</span><button type="button" disabled={Boolean(importing)} onClick={() => importImage(candidate)}>{importing === candidate.url ? <FaSpinner className={styles.spin} /> : <FaCheck />} Usar</button></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
