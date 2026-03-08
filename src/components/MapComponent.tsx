"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapComponent.module.css';

import { restaurantsData, Restaurant, newsArticlesData } from '@/data/mockData';
import { FaInstagram, FaFacebook, FaTwitter, FaGlobe, FaPhone, FaUtensils, FaStar, FaTimes, FaNewspaper, FaDirections } from 'react-icons/fa';
import Link from 'next/link';

// Fix for Next.js Leaflet icon issue
const iconDefault = L.icon({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const userIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function MapComponent() {
    const defaultCenter: [number, number] = [19.4326, -99.1332]; // CDMX Zocalo
    const [position, setPosition] = useState<[number, number]>(defaultCenter);
    const [hasLocation, setHasLocation] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

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
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    setHasLocation(true);
                },
                (err) => console.warn(err)
            );
        }
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
                            onClick={() => {
                                setPosition([place.lat, place.lng]);
                                setSelectedRestaurant(place);
                            }}
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
                                <MapContainer
                                    center={[selectedRestaurant.lat, selectedRestaurant.lng]}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                    dragging={false}
                                    doubleClickZoom={false}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[selectedRestaurant.lat, selectedRestaurant.lng]} icon={iconDefault} />
                                </MapContainer>
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

            <MapContainer
                center={position}
                zoom={hasLocation ? 14 : 12}
                className={styles.map}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ChangeView center={position} zoom={hasLocation ? 14 : 12} />

                {hasLocation && (
                    <Marker position={position} icon={userIcon}>
                        <Popup>AQUÍ ESTÁS</Popup>
                    </Marker>
                )}

                {restaurantsData.map((place) => (
                    <Marker 
                        key={place.id} 
                        position={[place.lat, place.lng]} 
                        icon={iconDefault}
                        eventHandlers={{
                            click: () => {
                                setPosition([place.lat, place.lng]);
                                setSelectedRestaurant(place);
                            }
                        }}
                    />
                ))}
            </MapContainer>
        </div>
    );
}
