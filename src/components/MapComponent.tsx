"use client";

import React, { useEffect, useState, useCallback } from 'react';
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
    MapPin
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
    const router = useRouter();

    const map = useMap();
    const geocodingLib = useMapsLibrary('geocoding');

    useEffect(() => {
        const fetchRestaurants = async () => {
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
        };

        fetchRestaurants();
    }, []);

    const filteredRestaurants = restaurants.filter(r => 
        (r.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.category || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(loc);
                    setCenter(loc);
                    setZoom(14);
                },
                (err) => console.warn(err)
            );
        }
    }, []);

    useEffect(() => {
        const fetchMissingCoords = async () => {
            if (!geocodingLib || restaurants.length === 0) return;
            
            const geocoder = new geocodingLib.Geocoder();
            const updatedRestaurants = [...restaurants];
            let changed = false;

            for (let i = 0; i < updatedRestaurants.length; i++) {
                const r = updatedRestaurants[i];
                // Only geocode if coordinates are missing and address is present
                if ((!r.lat || !r.lng || r.lat === 19.4326 && r.lng === -99.1332) && r.address) {
                    try {
                        const result = await geocoder.geocode({ address: r.address });
                        if (result.results && result.results[0]) {
                            const { lat, lng } = result.results[0].geometry.location;
                            updatedRestaurants[i] = { ...r, lat: lat(), lng: lng() };
                            changed = true;
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
        fetchMissingCoords();
    }, [geocodingLib, restaurants, searchQuery]); // Added dependencies to trigger when lib loads or data changes

    const handleRestaurantSelect = useCallback((restaurant: any) => {
        const name = restaurant.restaurantName || restaurant.name;
        router.push(`/lugares/${slugify(name)}`);
    }, [router]);

    const googleMapsUrl = selectedRestaurant 
        ? `https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.lat},${selectedRestaurant.lng}`
        : "#";

    if (loading) return <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9' }}>Cargando restaurantes...</div>;

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
                </ul>
            </div>

            <Map
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
                defaultCenter={center}
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
        </div>
    );
}
