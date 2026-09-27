"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap,
  useMapsLibrary,
  Pin
} from '@vis.gl/react-google-maps';
import styles from './MapComponent.module.css';
import { slugify, isPublished } from "@/lib/utils";

import { 
    Globe, 
    Phone, 
    UtensilsCrossed, 
    Star, 
    X, 
    Newspaper, 
    Navigation,
    Search,
    MapPin,
    Crosshair
} from 'lucide-react';
import { FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa';
import Link from 'next/link';
import FoodPin from './FoodPin';
import GoogleMapsWrapper from './GoogleMapsWrapper';

const normalizar = (valor: unknown) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const CENTROS: Record<string, { lat: number; lng: number; estado: string }> = {
    cdmx: { lat: 19.4326, lng: -99.1332, estado: "CDMX" },
    "ciudad de mexico": { lat: 19.4326, lng: -99.1332, estado: "CDMX" },
    puebla: { lat: 19.0414, lng: -98.2063, estado: "Puebla" },
    oaxaca: { lat: 17.0732, lng: -96.7266, estado: "Oaxaca" },
    "baja california": { lat: 32.5149, lng: -117.0382, estado: "Baja California" },
    "quintana roo": { lat: 20.6296, lng: -87.0739, estado: "Quintana Roo" },
};

function ubicacionBase(place: Record<string, unknown>) {
    const texto = normalizar(`${place.city || ""} ${place.ciudad || ""} ${place.estado || ""} ${place.state || ""} ${place.address || ""}`);
    const clave = Object.keys(CENTROS).find((nombre) => texto.includes(nombre));
    return CENTROS[clave || "cdmx"];
}

function desplazamientoEstable(id: string) {
    let semilla = 0;
    for (let indice = 0; indice < id.length; indice += 1) semilla = (semilla * 31 + id.charCodeAt(indice)) >>> 0;
    const angulo = (semilla % 360) * Math.PI / 180;
    const radio = 0.006 + ((semilla >>> 8) % 28) / 1000;
    return { lat: Math.sin(angulo) * radio, lng: Math.cos(angulo) * radio };
}

export default function MapComponent() {
    return (
        <GoogleMapsWrapper>
            <MapContent />
        </GoogleMapsWrapper>
    );
}

function MapContent() {
    const defaultCenter = { lat: 19.4326, lng: -99.1332 }; // CDMX Zocalo
    const [center, setCenter] = useState(defaultCenter);
    const [zoom, setZoom] = useState(12);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    // Secciones del mapa: el buscador libre no sirve para explorar, sólo para
    // buscar algo que ya sabes cómo se llama.
    const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
    const [filtroCocina, setFiltroCocina] = useState<string | null>(null);
    const [soloMichelin, setSoloMichelin] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [locating, setLocating] = useState(false);
    const router = useRouter();

    const map = useMap();
    const geocodingLib = useMapsLibrary('geocoding');

    const fetchRestaurants = useCallback(async () => {
        try {
            const response = await fetch("/api/restaurants");
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "No se pudo cargar el catálogo.");
            const data = payload.restaurants.filter((d: Record<string, unknown>) => isPublished(d)).map((d: Record<string, any>) => {
                const base = ubicacionBase(d);
                const lat = Number(d.lat);
                const lng = Number(d.lng);
                const tieneCoordenadas = Number.isFinite(lat) && Number.isFinite(lng);
                const offset = desplazamientoEstable(String(d.id));
                return {
                    id: d.id,
                    name: d.restaurantName || d.name,
                    ...d,
                    city: d.city || d.ciudad || base.estado,
                    estado: d.estado || d.state || base.estado,
                    lat: tieneCoordenadas ? lat : base.lat + offset.lat,
                    lng: tieneCoordenadas ? lng : base.lng + offset.lng,
                    coordinatesApproximate: !tieneCoordenadas,
                };
            });
            setRestaurants(data);
        } catch (err) {
            console.error("Error fetching map restaurants:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRestaurants();
    }, [fetchRestaurants]);

    // Estados y cocinas salen del propio directorio: si mañana entra un lugar de
    // Yucatán, la sección aparece sola.
    const contar = (campo: string) => {
        const cuenta: Record<string, number> = {};
        restaurants.forEach(r => { const v = r[campo]; if (v) cuenta[v] = (cuenta[v] || 0) + 1; });
        return Object.entries(cuenta).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    };
    const estados = contar("estado");
    const cocinas = contar("category");
    const hayFiltros = Boolean(filtroEstado || filtroCocina || soloMichelin || searchQuery);

    const filteredRestaurants = restaurants.filter(r => {
        const texto = normalizar(searchQuery);
        const indice = normalizar(`${r.name} ${r.category} ${r.estado} ${r.state} ${r.city} ${r.ciudad} ${r.address}`);
        const coincideTexto = !texto
            || indice.includes(texto);
        return coincideTexto
            && (!filtroEstado || normalizar(r.estado || r.state) === normalizar(filtroEstado))
            && (!filtroCocina || normalizar(r.category).includes(normalizar(filtroCocina)))
            && (!soloMichelin || Boolean(r.isMichelin));
    });

    const limpiarFiltros = () => { setFiltroEstado(null); setFiltroCocina(null); setSoloMichelin(false); setSearchQuery(""); };

    const handleLocateUser = useCallback(() => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            setLocating(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(loc);
                    setCenter(loc);
                    setZoom(15);
                    setLocating(false);
                    if (map) {
                        map.panTo(loc);
                        map.setZoom(15);
                    }
                },
                (err) => {
                    console.warn("Geolocation error:", err);
                    setLocating(false);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    }, [map]);

    const lastBoundsRef = useRef<string>("");

    useEffect(() => {
        if (!map || filteredRestaurants.length === 0) return;
        
        // Create a string representation of the current set of restaurants to avoid redundant fitBounds
        const boundsHash = filteredRestaurants.map(r => `${r.lat},${r.lng}`).join('|');
        if (boundsHash === lastBoundsRef.current) return;
        lastBoundsRef.current = boundsHash;

        const bounds = new google.maps.LatLngBounds();
        filteredRestaurants.forEach(r => bounds.extend({ lat: r.lat, lng: r.lng }));
        
        map.fitBounds(bounds, {
            top: 100,
            right: 50,
            bottom: 50,
            left: 350 // Account for the sidebar width
        });
    }, [map, filteredRestaurants]); // Remove searchQuery from here, filteredRestaurants is enough

    // El catálogo muestra todos los lugares desde el primer render usando una
    // posición estable alrededor de su ciudad. La dirección exacta se geocodifica
    // únicamente cuando el usuario abre un lugar, evitando 140 solicitudes y
    // posibles límites de cuota en cada visita al mapa.
    useEffect(() => {
        if (!geocodingLib || !selectedRestaurant?.coordinatesApproximate || !selectedRestaurant.address) return;
        let cancelado = false;
        const geocoder = new geocodingLib.Geocoder();
        geocoder.geocode({ address: `${selectedRestaurant.address}, México` }).then((result) => {
            const location = result.results?.[0]?.geometry.location;
            if (!location || cancelado) return;
            const exacto = { ...selectedRestaurant, lat: location.lat(), lng: location.lng(), coordinatesApproximate: false };
            setRestaurants((actuales) => actuales.map((place) => place.id === exacto.id ? exacto : place));
            setSelectedRestaurant(exacto);
            map?.panTo({ lat: exacto.lat, lng: exacto.lng });
        }).catch((error) => console.warn("No se pudo precisar la dirección", error));
        return () => { cancelado = true; };
    }, [geocodingLib, map, selectedRestaurant]);

    // Seleccionar abre la ficha sobre el mapa y centra ahí; para ir al detalle
    // está el botón "Ver lugar" dentro de la ficha.
    const handleRestaurantSelect = useCallback((restaurant: any) => {
        setSelectedRestaurant(restaurant);
        if (map && restaurant.lat && restaurant.lng) {
            map.panTo({ lat: restaurant.lat, lng: restaurant.lng });
            if ((map.getZoom() ?? 0) < 15) map.setZoom(15);
        }
    }, [map]);

    const irAlLugar = useCallback((restaurant: any) => {
        router.push(`/lugares/${slugify(restaurant.restaurantName || restaurant.name)}`);
    }, [router]);

    if (loading) return <div style={{ height: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
            <div className={styles.spinner}></div>
            <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 500 }}>Explorando la ciudad...</p>
        </div>
    </div>;

    return (
        <div className={styles.mapContainer}>
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2>Explorar</h2>
                    <p>Encuentra los mejores restaurantes en el mapa.</p>
                    <div className={styles.searchBox}>
                        <Search className={styles.searchIcon} size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar especialidad o nombre..." 
                            className={styles.searchInput} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className={styles.secciones}>
                        <div className={styles.seccion}>
                            <h3>Por estado</h3>
                            <div className={styles.chips}>
                                {estados.map(([nombre, total]) => (
                                    <button
                                        key={nombre}
                                        type="button"
                                        aria-pressed={filtroEstado === nombre}
                                        className={filtroEstado === nombre ? styles.chipActivo : styles.chip}
                                        onClick={() => setFiltroEstado(filtroEstado === nombre ? null : nombre)}
                                    >
                                        {nombre} <em>{total}</em>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.seccion}>
                            <h3>Por cocina</h3>
                            <div className={styles.chips}>
                                {cocinas.map(([nombre, total]) => (
                                    <button
                                        key={nombre}
                                        type="button"
                                        aria-pressed={filtroCocina === nombre}
                                        className={filtroCocina === nombre ? styles.chipActivo : styles.chip}
                                        onClick={() => setFiltroCocina(filtroCocina === nombre ? null : nombre)}
                                    >
                                        {nombre} <em>{total}</em>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.seccionPie}>
                            <button
                                type="button"
                                aria-pressed={soloMichelin}
                                className={soloMichelin ? styles.chipActivo : styles.chip}
                                onClick={() => setSoloMichelin(!soloMichelin)}
                            >
                                <Star size={13} fill="currentColor" /> Con estrella Michelin
                            </button>
                            {hayFiltros && (
                                <button type="button" className={styles.limpiar} onClick={limpiarFiltros}>
                                    Limpiar filtros
                                </button>
                            )}
                        </div>

                        <p className={styles.conteo}>
                            {filteredRestaurants.length === restaurants.length
                                ? `${restaurants.length} lugares en el mapa`
                                : `${filteredRestaurants.length} de ${restaurants.length} lugares`}
                        </p>
                    </div>
                </div>
                <ul className={styles.placesList}>
                    {filteredRestaurants.map(place => (
                        <li 
                            key={place.id} 
                            className={`${styles.placeItem} ${selectedRestaurant?.id === place.id ? styles.active : ""}`}
                            onClick={() => handleRestaurantSelect(place)}
                            onMouseEnter={() => setHoveredId(place.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            <span className={styles.placeIcon}><FoodPin category={place.category} size={16} /></span>
                            <div>
                                <div className={styles.placeName}>{place.name}</div>
                                <div className={styles.placeCategory}>{place.category}</div>
                            </div>
                        </li>
                    ))}
                    {filteredRestaurants.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                            <p>No se encontraron lugares.</p>
                        </div>
                    )}
                </ul>
            </div>

            <div className={styles.mapWrapper}>
                <Map
                    mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
                    defaultCenter={defaultCenter}
                    defaultZoom={zoom}
                    center={center}
                    zoom={zoom}
                    onCenterChanged={ev => setCenter(ev.detail.center)}
                    onZoomChanged={ev => setZoom(ev.detail.zoom)}
                    className={styles.map}
                    gestureHandling={'greedy'}
                    disableDefaultUI={false}
                >
                    {userLocation && (
                        <AdvancedMarker position={userLocation}>
                            <div className={styles.userLocationMarker}>
                                <div className={styles.userLocationDot} />
                                <div className={styles.userLocationPulse} />
                            </div>
                        </AdvancedMarker>
                    )}

                    {filteredRestaurants.map((place) => (
                        <AdvancedMarker 
                            key={place.id} 
                            position={{ lat: place.lat, lng: place.lng }} 
                            title={place.name}
                            zIndex={selectedRestaurant?.id === place.id ? 10 : hoveredId === place.id ? 5 : 1}
                            onClick={() => handleRestaurantSelect(place)}
                        >
                            <div
                                className={`${styles.customMarker} ${place.isMichelin ? styles.michelinMarker : ""} ${selectedRestaurant?.id === place.id || hoveredId === place.id ? styles.markerActive : ""}`}
                                onMouseEnter={() => setHoveredId(place.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <FoodPin category={place.category} />
                            </div>
                        </AdvancedMarker>
                    ))}

                    {selectedRestaurant && (
                        <InfoWindow
                            position={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }}
                            onCloseClick={() => setSelectedRestaurant(null)}
                            pixelOffset={[0, -38]}
                            headerDisabled
                        >
                            <div className={styles.infoCard}>
                                <button className={styles.infoClose} onClick={() => setSelectedRestaurant(null)} aria-label="Cerrar"><X size={16} /></button>
                                {selectedRestaurant.image && <img src={selectedRestaurant.image} alt={selectedRestaurant.name} />}
                                <div className={styles.infoBody}>
                                    <small><UtensilsCrossed size={13} /> {selectedRestaurant.category || "Cocina mexicana"}</small>
                                    <h3>{selectedRestaurant.name}</h3>
                                    {selectedRestaurant.address && <p><MapPin size={13} /> {selectedRestaurant.address}</p>}
                                    {selectedRestaurant.rating && <p><Star size={13} fill="currentColor" /> {Number(selectedRestaurant.rating).toFixed(1)}</p>}
                                    <div className={styles.infoActions}>
                                        <button onClick={() => irAlLugar(selectedRestaurant)}>Ver lugar</button>
                                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.lat},${selectedRestaurant.lng}`} target="_blank" rel="noopener noreferrer"><Navigation size={14} /> Cómo llegar</a>
                                    </div>
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </Map>
                
                <button 
                    className={`${styles.locateBtn} ${locating ? styles.locating : ""}`}
                    onClick={handleLocateUser}
                    title="Mi ubicación"
                >
                    <Crosshair size={20} />
                </button>
            </div>
        </div>
    );
}
