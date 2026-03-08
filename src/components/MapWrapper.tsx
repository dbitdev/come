"use client";

import dynamic from "next/dynamic";
import React from 'react';

const MapComponent = dynamic(() => import("./MapComponent"), {
    ssr: false,
    loading: () => <div style={{ height: "calc(100vh - 80px)", display: "flex", justifyContent: "center", alignItems: "center" }}>Cargando mapa...</div>
});

export default function MapWrapper() {
    return <MapComponent />;
}
