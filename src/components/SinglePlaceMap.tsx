"use client";

import React from 'react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import GoogleMapsWrapper from './GoogleMapsWrapper';

interface SingleMapProps {
    lat: number;
    lng: number;
    name: string;
}

export default function SinglePlaceMap({ lat, lng, name }: SingleMapProps) {
    const position = { lat, lng };

    return (
        <GoogleMapsWrapper>
            <Map
                mapId="bf50a91342b3225"
                defaultCenter={position}
                defaultZoom={15}
                gestureHandling={'none'}
                disableDefaultUI={true}
                style={{ width: '100%', height: '100%', minHeight: '300px' }}
            >
                <AdvancedMarker position={position} title={name}>
                    <Pin background={'#000'} glyphColor={'#fff'} borderColor={'#000'} />
                </AdvancedMarker>
            </Map>
        </GoogleMapsWrapper>
    );
}
