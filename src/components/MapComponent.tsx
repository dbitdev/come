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
import { slugify } from '@/lib/utils';

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
import GoogleMapsWrapper from './GoogleMapsWrapper';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

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
    const [loading, setLoading] = useState(true);
    const [locating, setLocating] = useState(false);
    const router = useRouter();

    const map = useMap();
    const geocodingLib = useMapsLibrary('geocoding');

    const fetchRestaurants = useCallback(async () => {
        if (!db) return;
        try {
            const querySnapshot = await getDocs(collection(db, "business_leads"));
            const data = querySnapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    name: d.restaurantName || d.name,
                    lat: d.lat || 19.4326,
                    lng: d.lng || -99.1332,
                    ...d
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

    const filteredRestaurants = restaurants.filter(r => 
        (r.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.category || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    useEffect(() => {
        handleLocateUser();
    }, []); // Only run once on mount

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

    // Use a separate effect for geocoding that doesn't depend on the whole restaurants array directly if possible
    // or at least only runs once we have the lib and initial data
    const geocodingAttemptedRef = useRef<boolean>(false);

    useEffect(() => {
        const fetchMissingCoords = async () => {
            if (!geocodingLib || restaurants.length === 0 || geocodingAttemptedRef.current) return;
            
            geocodingAttemptedRef.current = true; // Prevent multiple simultaneous geocoding runs
            
            const geocoder = new geocodingLib.Geocoder();
            const updatedRestaurants = [...restaurants];
            let changed = false;

            for (let i = 0; i < updatedRestaurants.length; i++) {
                const r = updatedRestaurants[i];
                // Only geocode if it has the default CDMX center AND has an address
                const isDefault = r.lat === 19.4326 && r.lng === -99.1332;
                if ((!r.lat || !r.lng || isDefault) && r.address) {
                    try {
                        const result = await geocoder.geocode({ address: r.address });
                        if (result.results && result.results[0]) {
                            const { lat, lng } = result.results[0].geometry.location;
                            const newLat = lat();
                            const newLng = lng();
                            
                            // Double check it's actually different from what we have
                            if (Math.abs(newLat - r.lat) > 0.0001 || Math.abs(newLng - r.lng) > 0.0001) {
                                updatedRestaurants[i] = { ...r, lat: newLat, lng: newLng };
                                changed = true;
                            }
                        }
                    } catch (e) {
                        console.error("Geocoding failed for", r.name, e);
                    }
                }
            }

            if (changed) {
                setRestaurants(updatedRestaurants);
            }
        };

        // We only want to run this when geocodingLib becomes available or first batch of restaurants come in
        if (geocodingLib && restaurants.length > 0 && !geocodingAttemptedRef.current) {
            fetchMissingCoords();
        }
    }, [geocodingLib, restaurants.length]); // Only depend on length to avoid reference loops

    const handleRestaurantSelect = useCallback((restaurant: any) => {
        const name = restaurant.restaurantName || restaurant.name;
        router.push(`/lugares/${slugify(name)}`);
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
                </div>
                <ul className={styles.placesList}>
                    {filteredRestaurants.slice(0, 50).map(place => (
                        <li 
                            key={place.id} 
                            className={styles.placeItem} 
                            onClick={() => handleRestaurantSelect(place)}
                        >
                            <div className={styles.placeName}>{place.name}</div>
                            <div className={styles.placeCategory}>{place.category}</div>
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
                    mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
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
                            onClick={() => handleRestaurantSelect(place)}
                        >
                            <div className={`${styles.customMarker} ${place.isMichelin ? styles.michelinMarker : ""}`}>
                                {place.isMichelin ? <Star size={14} fill="currentColor" /> : <MapPin size={16} fill="white" />}
                            </div>
                        </AdvancedMarker>
                    ))}
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
