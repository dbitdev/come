"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Map, 
  AdvancedMarker, 
  useMap,
  InfoWindow
} from '@vis.gl/react-google-maps';
import { MapPin, Star, X } from 'lucide-react';
import GoogleMapsWrapper from './GoogleMapsWrapper';
import { GuideStop } from '@/types/guide';
import styles from './InteractiveGuideMap.module.css';

interface InteractiveGuideMapProps {
  stops: GuideStop[];
  activeStopIndex: number;
}

export default function InteractiveGuideMap(props: InteractiveGuideMapProps) {
    return (
        <GoogleMapsWrapper>
            <MapContent {...props} />
        </GoogleMapsWrapper>
    );
}

function MapContent({ stops, activeStopIndex }: InteractiveGuideMapProps) {
    const map = useMap();
    const [center, setCenter] = useState({ lat: 19.4326, lng: -99.1332 });
    const [zoom, setZoom] = useState(12);
    const [selectedStop, setSelectedStop] = useState<GuideStop | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile for layout logic
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!map || stops.length === 0) return;
        
        // If mobile, fit all pins
        if (isMobile) {
            const bounds = new google.maps.LatLngBounds();
            stops.forEach(stop => bounds.extend({ lat: stop.location.lat, lng: stop.location.lng }));
            map.fitBounds(bounds, {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50
            });
            return;
        }

        // Desktop behavior: zoom to active stop
        if (activeStopIndex === -1 || !stops[activeStopIndex]) return;
        const activeStop = stops[activeStopIndex];
        const newPos = { 
            lat: activeStop.location.lat, 
            lng: activeStop.location.lng 
        };

        map.panTo(newPos);
        map.setZoom(16);
        setCenter(newPos);
        setZoom(16);
    }, [map, activeStopIndex, stops, isMobile]);

    return (
        <div className={styles.mapContainer}>
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
                {stops.map((stop, index) => (
                    <AdvancedMarker 
                        key={stop.id} 
                        position={{ lat: stop.location.lat, lng: stop.location.lng }}
                        onClick={() => {
                            setSelectedStop(stop);
                            map?.panTo({ lat: stop.location.lat, lng: stop.location.lng });
                        }}
                    >
                        <div className={`${styles.marker} ${index === activeStopIndex ? styles.activeMarker : ""}`}>
                            <div className={styles.markerContent}>
                                <MapPin size={20} fill={index === activeStopIndex ? "white" : "currentColor"} />
                                <span className={styles.markerLabel}>{index + 1}</span>
                            </div>
                        </div>
                    </AdvancedMarker>
                ))}

                {selectedStop && (
                    <InfoWindow
                        position={{ lat: selectedStop.location.lat, lng: selectedStop.location.lng }}
                        onCloseClick={() => setSelectedStop(null)}
                    >
                        <div className={styles.infoWindow}>
                            <h3 className={styles.infoTitle}>{selectedStop.title}</h3>
                            <p className={styles.infoAddress}>{selectedStop.location.address}</p>
                            <p className={styles.infoDescription}>
                                {selectedStop.content.length > 150 
                                    ? selectedStop.content.substring(0, 150) + '...' 
                                    : selectedStop.content}
                            </p>
                            {selectedStop.location.restaurantId && (
                                <a 
                                    href={`/lugares/${selectedStop.location.restaurantId}`} 
                                    className={styles.infoLink}
                                >
                                    Ver perfil completo
                                </a>
                            )}
                        </div>
                    </InfoWindow>
                )}
            </Map>
        </div>
    );
}
