"use client";

import dynamic from 'next/dynamic';

const SinglePlaceMap = dynamic(() => import('./SinglePlaceMap'), {
    ssr: false,
    loading: () => <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>Cargando ubicación...</div>
});

export default SinglePlaceMap;
