"use client";

import React from "react";
import dynamic from "next/dynamic";
import styles from "@/app/page.module.css";

const MapComponent = dynamic(() => import("./MapComponent"), { 
    ssr: false,
    loading: () => <div style={{ height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando mapa...</div>
});

export default function HomeMap() {
    return (
        <div className={styles.mapWrapper}>
            <MapComponent />
        </div>
    );
}
