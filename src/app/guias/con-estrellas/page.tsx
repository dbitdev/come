import React from 'react';
import PlacesList from '@/components/PlacesList';
import { restaurantsData } from '@/data/mockData';
import MapWrapper from '@/components/MapWrapper';

export default function MichelinGuidePage() {
    const michelinPlaces = restaurantsData.filter(r => r.isMichelin);

    return (
        <div style={{ paddingTop: '80px', minHeight: '100vh', backgroundColor: '#fff' }}>
            <div style={{ padding: '4rem 2rem 2rem 2rem', textAlign: 'center', backgroundColor: '#fafafa', borderBottom: '1px solid #eaeaea' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                    Guía Michelin México
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#555', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
                    Descubre los restaurantes galardonados que han elevado la gastronomía mexicana a niveles de excelencia mundial.
                </p>
            </div>

            <PlacesList
                title="Restaurantes Galardonados"
                subtitle="La excelencia culinaria de México en 2026"
                places={michelinPlaces}
                showMichelin={true}
            />

            <div style={{ padding: '2rem', height: '600px', backgroundColor: '#fff' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>Ubicaciones Michelin</h2>
                {/* We can reuse MapWrapper to show all the places! */}
                <MapWrapper />
            </div>
        </div>
    );
}
