"use client";

import { useCallback, useSyncExternalStore } from "react";

export type SavedLocation = {
  label: string;
  lat: number;
  lng: number;
  savedAt: number;
};

const STORAGE_KEY = "come:ubicacion";
const EVENT = "come:ubicacion-cambio";

export function readSavedLocation(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedLocation;
    if (typeof parsed?.lat !== "number" || typeof parsed?.lng !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSavedLocation(location: Omit<SavedLocation, "savedAt"> | null) {
  if (typeof window === "undefined") return;
  cache = location ? { ...location, savedAt: Date.now() } : null;
  try {
    if (cache) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* modo privado o almacenamiento lleno: la sesión sigue funcionando sin guardar */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

// `useSyncExternalStore` exige una instantánea estable: se cachea el objeto y
// sólo se reemplaza cuando cambia lo guardado.
let cache: SavedLocation | null | undefined;
let cacheRaw: string | null = null;

function snapshot(): SavedLocation | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cacheRaw || cache === undefined) {
    cacheRaw = raw;
    cache = readSavedLocation();
  }
  return cache;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Ubicación de entrega recordada en el navegador. En el render del servidor
 * siempre es null y se rellena en cuanto hidrata el cliente.
 */
export function useSavedLocation() {
  const location = useSyncExternalStore(subscribe, snapshot, () => null);
  const save = useCallback((next: Omit<SavedLocation, "savedAt"> | null) => writeSavedLocation(next), []);
  return { location, save };
}

export type GeocodeHit = { label: string; lat: number; lng: number };

/**
 * Búsqueda de direcciones contra la API de Geocoding (permite CORS desde el
 * navegador, a diferencia de Places Autocomplete).
 */
export async function searchAddresses(query: string, signal?: AbortSignal): Promise<GeocodeHit[]> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || query.trim().length < 3) return [];
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:MX&language=es&key=${key}`;
  const response = await fetch(url, { signal });
  const data = await response.json();
  if (data.status !== "OK" || !Array.isArray(data.results)) return [];
  return data.results.slice(0, 6).map((result: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }) => ({
    label: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `Ubicación actual · ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return fallback;
  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=es&key=${key}`);
    const data = await response.json();
    return data.results?.[0]?.formatted_address || fallback;
  } catch {
    return fallback;
  }
}
