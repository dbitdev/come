'use client';

import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import ErrorBoundary from './ErrorBoundary';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function GoogleMapsWrapper({ children }: { children: React.ReactNode }) {
  const [errorStatus, setErrorStatus] = React.useState<string | null>(null);

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

  const errorFallback = (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#fff3cd',
      color: '#856404',
      padding: '40px 20px',
      textAlign: 'center',
      borderRadius: '8px',
      border: '1px solid #ffeeba',
      minHeight: '400px'
    }}>
      <h3 style={{ marginBottom: '15px', fontSize: '1.5rem' }}>Aviso de Google Maps</h3>
      <p style={{ marginBottom: '10px' }}>
        {errorStatus === 'RefererNotAllowedMapError' 
          ? 'Tu entorno local (localhost:3000) no tiene acceso autorizado para esta clave de API.' 
          : 'Hubo un problema al inicializar el mapa de Google.'}
      </p>
      <p style={{ fontSize: '0.95rem', marginTop: '10px', maxWidth: '500px', lineHeight: 1.5 }}>
        Por favor, sigue las instrucciones en la <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: '#856404', fontWeight: 'bold', textDecoration: 'underline' }}>Consola de Google Cloud</a> para autorizar localhost o desactivar las restricciones de dominio temporalmente.
      </p>
      <button 
        onClick={() => window.location.reload()}
        style={{ marginTop: '20px', padding: '10px 20px', background: '#856404', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Reintentar carga
      </button>
    </div>
  );

  if (errorStatus) {
    return errorFallback;
  }

  return (
    <ErrorBoundary fallback={errorFallback}>
      <APIProvider 
        apiKey={API_KEY} 
        libraries={['geocoding']}
        onLoad={() => console.log('Google Maps API loaded successfully')}
        onError={(err) => {
          console.error('Google Maps API failed to load:', err);
          setErrorStatus('RefererNotAllowedMapError');
        }}
      >
        {children}
      </APIProvider>
    </ErrorBoundary>
  );
}
