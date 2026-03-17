'use client';

import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function GoogleMapsWrapper({ children }: { children: React.ReactNode }) {
  if (!API_KEY) {
    console.error("Google Maps API Key is missing in environment variables (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)");
    return (
      <div style={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8d7da',
        color: '#721c24',
        padding: '20px',
        textAlign: 'center',
        borderRadius: '8px',
        border: '1px solid #f5c6cb'
      }}>
        Falta la clave de API de Google Maps. Configúrala en el archivo .env.local.
      </div>
    );
  }

  return (
    <APIProvider 
      apiKey={API_KEY} 
      onLoad={() => console.log('Google Maps API loaded successfully')}
      onError={(err) => console.error('Google Maps API failed to load:', err)}
    >
      {children}
    </APIProvider>
  );
}
