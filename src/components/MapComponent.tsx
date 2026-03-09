"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap,
  Pin
} from '@vis.gl/react-google-maps';
import styles from './MapComponent.module.css';

import { restaurantsData, Restaurant, newsArticlesData } from '@/data/mockData';
import { FaInstagram, FaFacebook, FaTwitter, FaGlobe, FaPhone, FaUtensils, FaStar, FaTimes, FaNewspaper, FaDirections } from 'react-icons/fa';
import Link from 'next/link';
import GoogleMapsWrapper from './GoogleMapsWrapper';

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
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [infoWindowOpen, setInfoWindowOpen] = useState(false);

    const map = useMap();

    const filteredRestaurants = restaurantsData.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const relatedNotes = selectedRestaurant 
        ? newsArticlesData.filter(article => article.relatedRestaurantIds?.includes(selectedRestaurant.id))
        : [];

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

    const handleRestaurantSelect = useCallback((restaurant: Restaurant) => {
        const pos = { lat: restaurant.lat, lng: restaurant.lng };
        setCenter(pos);
        setSelectedRestaurant(restaurant);
        setInfoWindowOpen(true);
    }, []);

    const googleMapsUrl = selectedRestaurant 
        ? `https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.lat},${selectedRestaurant.lng}`
        : "#";

    return (
        <div className={styles.mapContainer}>
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2>Explorar</h2>
                    <p>Encuentra los 100 mejores restaurantes cerca de ti.</p>
                    <div className={styles.searchBox}>
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
                            className={`${styles.placeItem} ${selectedRestaurant?.id === place.id ? styles.active : ""}`} 
                            onClick={() => handleRestaurantSelect(place)}
                        >
                            <div className={styles.placeName}>{place.name}</div>
                            <div className={styles.placeCategory}>{place.category}</div>
                        </li>
                    ))}
                </ul>
            </div>

            {selectedRestaurant && (
                <div className={styles.modalOverlay} onClick={() => setSelectedRestaurant(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setSelectedRestaurant(null)}>
                            <FaTimes />
                        </button>

                        <div className={styles.modalMain}>
                            <img src={selectedRestaurant.image} alt={selectedRestaurant.name} className={styles.modalCover} />
                            
                            <div className={styles.modalBody}>
                                <div className={styles.modalHeaderRow}>
                                    <div>
                                        <h2 className={styles.modalTitle}>{selectedRestaurant.name}</h2>
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                            <span className={styles.placeCategory}>{selectedRestaurant.category}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', color: '#f5c518', fontWeight: 'bold' }}>
                                                <FaStar style={{ marginRight: '4px' }} /> {selectedRestaurant.rating}
                                            </div>
                                        </div>
                                    </div>
                                    {selectedRestaurant.isMichelin && (
                                        <div className={styles.michelinBadge}>
                                            <img src="/michelin-star.png" alt="Michelin" className={styles.michelinIcon} />
                                            <span>Guía Michelin</span>
                                        </div>
                                    )}
                                </div>

                                <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '2rem' }}>{selectedRestaurant.address}</p>

                                <div className={styles.modalInfoGrid}>
                                    <div className={styles.infoCol}>
                                        <h4 style={{ marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', color: '#888' }}>Contacto</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            <a href={`tel:${selectedRestaurant.phone}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}><FaPhone color="var(--primary)"/> {selectedRestaurant.phone}</a>
                                            <a href={selectedRestaurant.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}><FaGlobe color="var(--primary)"/> Web Oficial</a>
                                        </div>
                                    </div>
                                    <div className={styles.infoCol}>
                                        <h4 style={{ marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', color: '#888' }}>Redes Sociales</h4>
                                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '1.5rem' }}>
                                            {selectedRestaurant.socials?.instagram && <a href={selectedRestaurant.socials.instagram} target="_blank" rel="noreferrer" style={{ color: '#E1306C' }}><FaInstagram /></a>}
                                            {selectedRestaurant.socials?.facebook && <a href={selectedRestaurant.socials.facebook} target="_blank" rel="noreferrer" style={{ color: '#4267B2' }}><FaFacebook /></a>}
                                            {selectedRestaurant.socials?.twitter && <a href={selectedRestaurant.socials.twitter} target="_blank" rel="noreferrer" style={{ color: '#1DA1F2' }}><FaTwitter /></a>}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
                                    <Link href={`/lugares/menu/${selectedRestaurant.id}`} className={styles.directionsBtn} style={{ flex: 1, backgroundColor: '#000' }}>
                                        <FaUtensils /> Ver Menú Digital
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className={styles.miniMapColumn}>
                            <div className={styles.miniMapWrapper}>
                                <Map
                                    mapId="bf50a91342b3225"
                                    center={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                    disableDefaultUI={true}
                                    gestureHandling={'none'}
                                >
                                    <AdvancedMarker position={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }}>
                                        <Pin background={'#000'} glyphColor={'#fff'} borderColor={'#000'} />
                                    </AdvancedMarker>
                                </Map>
                            </div>
                            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className={styles.directionsBtn}>
                                <FaDirections /> Cómo llegar
                            </a>
                            
                            {relatedNotes.length > 0 && (
                                <div style={{ padding: '2rem' }}>
                                    <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#888' }}><FaNewspaper /> NOTAS RELACIONADAS</h4>
                                    {relatedNotes.map(note => (
                                        <div key={note.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f0f0f0' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{note.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#999' }}>{note.date}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Map
                mapId="bf50a91342b3225"
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
                        <Pin background={'#ff0000'} glyphColor={'#fff'} borderColor={'#ff0000'} scale={1.2} />
                    </AdvancedMarker>
                )}

                {filteredRestaurants.map((place) => (
                    <AdvancedMarker 
                        key={place.id} 
                        position={{ lat: place.lat, lng: place.lng }} 
                        onClick={() => handleRestaurantSelect(place)}
                    >
                        <Pin background={'#000'} glyphColor={'#fff'} borderColor={'#000'} />
                    </AdvancedMarker>
                ))}
            </Map>
        </div>
    );
}
