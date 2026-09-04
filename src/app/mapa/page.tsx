import React from 'react';
import MapWrapper from '@/components/MapWrapper';

export default function Mapa() {
    return (
        <div style={{ height: 'calc(100vh - 78px)', minHeight: '680px', backgroundColor: '#fffdf7', overflow: 'hidden' }}>
            <MapWrapper />
        </div>
    );
}
