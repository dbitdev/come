'use client';

import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function GoogleMapsWrapper({ children }: { children: React.ReactNode }) {
  if (!API_KEY) {
    return (
      <div style={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f0f0f0',
        color: '#666',
        padding: '20px',
        textAlign: 'center'
      }}>
        Falta la clave de API de Google Maps (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      {children}
    </APIProvider>
  );
}
