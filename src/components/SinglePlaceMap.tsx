"use client";

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Next.js Leaflet icon issue
const iconDefault = L.icon({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

interface SingleMapProps {
    lat: number;
    lng: number;
    name: string;
}

export default function SinglePlaceMap({ lat, lng, name }: SingleMapProps) {
    const position: [number, number] = [lat, lng];

    return (
        <MapContainer
            center={position}
            zoom={15}
            scrollWheelZoom={false}
            style={{ width: '100%', height: '100%', minHeight: '300px', borderRadius: '0', zIndex: 1 }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} icon={iconDefault}>
                <Popup>
                    <strong>{name}</strong>
                </Popup>
            </Marker>
        </MapContainer>
    );
}
