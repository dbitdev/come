"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdvancedMarker, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import GoogleMapsWrapper from "./GoogleMapsWrapper";
import type { GeocodeHit, SavedLocation } from "@/lib/location";
import { reverseGeocode, searchAddresses } from "@/lib/location";
import styles from "./AddressPicker.module.css";

const CDMX = { lat: 19.4326, lng: -99.1332 };
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

function Recentrar({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center, zoom]);
  return null;
}

type Props = {
  value: SavedLocation | null;
  onSelect: (location: GeocodeHit) => void;
  onClose: () => void;
};

export default function AddressPicker({ value, onSelect, onClose }: Props) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "denied" | "unavailable">("idle");
  const [preview, setPreview] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  );
  const lastQuery = useRef(value?.label ?? "");

  // Resultados en vivo: se consulta 350 ms después de la última tecla.
  useEffect(() => {
    const term = query.trim();
    if (term === lastQuery.current) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (term.length < 3) { setHits([]); return; }
      setSearching(true);
      try {
        setHits(await searchAddresses(term, controller.signal));
      } catch {
        /* búsqueda cancelada o sin red */
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const center = useMemo(() => preview ?? CDMX, [preview]);

  function elegir(hit: GeocodeHit) {
    lastQuery.current = hit.label;
    setQuery(hit.label);
    setHits([]);
    setPreview({ lat: hit.lat, lng: hit.lng });
    onSelect(hit);
  }

  function ubicarme() {
    if (!navigator.geolocation) { setGeoState("unavailable"); return; }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const label = await reverseGeocode(lat, lng);
        setGeoState("idle");
        elegir({ label, lat, lng });
      },
      (error) => setGeoState(error.code === 1 ? "denied" : "unavailable"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <section className={styles.modal} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-label="Elegir dirección de entrega">
        <header>
          <h2>¿A dónde llevamos tu pedido?</h2>
          <button onClick={onClose} aria-label="Cerrar"><X /></button>
        </header>

        <div className={styles.map}>
          <GoogleMapsWrapper>
            <Map
              defaultCenter={center}
              defaultZoom={preview ? 16 : 11}
              mapId={MAP_ID}
              gestureHandling="greedy"
              disableDefaultUI
              zoomControl
            >
              {preview && (MAP_ID ? <AdvancedMarker position={preview} /> : <Marker position={preview} />)}
              <Recentrar center={center} zoom={preview ? 16 : 11} />
            </Map>
          </GoogleMapsWrapper>
        </div>

        <div className={styles.panel}>
          <div className={styles.field}>
            <Search size={20} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Calle y número, colonia o código postal"
              aria-label="Buscar una dirección"
            />
            {searching && <Loader2 className={styles.spin} size={18} />}
          </div>

          {hits.length > 0 && (
            <ul className={styles.results}>
              {hits.map((hit) => (
                <li key={`${hit.lat},${hit.lng}`}>
                  <button type="button" onClick={() => elegir(hit)}>
                    <MapPin size={17} /><span>{hit.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!hits.length && query.trim().length >= 3 && !searching && (
            <p className={styles.hint}>No encontramos esa dirección. Prueba con la calle y la colonia.</p>
          )}

          <button className={styles.locate} onClick={ubicarme} disabled={geoState === "loading"}>
            <Crosshair />
            <span>
              <b>{geoState === "loading" ? "Localizando…" : "Usar mi ubicación actual"}</b>
              <small>
                {geoState === "denied"
                  ? "El navegador bloqueó el permiso; actívalo para este sitio"
                  : geoState === "unavailable"
                  ? "No pudimos obtener tu ubicación; escribe la dirección"
                  : "Permite el acceso para encontrar lo que hay cerca"}
              </small>
            </span>
          </button>

          {value && <p className={styles.saved}>Guardada en este navegador: <b>{value.label}</b></p>}
        </div>
      </section>
    </div>
  );
}
