"use client";

import dynamic from 'next/dynamic';

const SinglePlaceMap = dynamic(() => import('./SinglePlaceMap'), {
    ssr: false,
    loading: () => <div style={{ width: '100%', height: '100%', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>Cargando ubicación...</div>
});

export default SinglePlaceMap;
