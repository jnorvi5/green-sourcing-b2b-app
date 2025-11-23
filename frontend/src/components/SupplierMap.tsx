// src/components/SupplierMap.tsx
// Interactive map component displaying supplier locations using Azure Maps

import React, { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

export interface SupplierLocation {
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

interface SupplierMapProps {
  suppliers: SupplierLocation[];
  height?: string;
  zoom?: number;
  className?: string;
  onSupplierClick?: (supplier: SupplierLocation) => void;
}

const SupplierMap: React.FC<SupplierMapProps> = ({
  suppliers,
  height = '500px',
  zoom = 2,
  className = '',
  onSupplierClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    const azureKey = import.meta.env.VITE_AZURE_MAPS_KEY;

    if (!azureKey) {
      setError('Azure Maps API key not found. Add VITE_AZURE_MAPS_KEY to your .env file.');
      console.error('❌ Azure Maps: Missing API key');
      return;
    }

    if (!mapRef.current) return;

    try {
      // Create map instance
      const map = new atlas.Map(mapRef.current, {
        authOptions: {
          authType: atlas.AuthenticationType.subscriptionKey,
          subscriptionKey: azureKey,
        },
        center: [0, 20], // Default center
        zoom: zoom,
        language: 'en-US',
        style: 'road',
        showFeedbackLink: false,
        showLogo: false,
      });

      mapInstanceRef.current = map;

      // Wait for map to be ready
      map.events.add('ready', () => {
        console.log('✅ Azure Maps initialized');
        setIsMapReady(true);
      });

      // Handle map errors
      map.events.add('error', (e: atlas.ErrorEvent) => {
        console.error('❌ Azure Maps error:', e);
        setError('Failed to load map. Please check your API key.');
      });

      // Cleanup on unmount
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.dispose();
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      console.error('❌ Azure Maps initialization failed:', err);
      setError('Failed to initialize map.');
    }
  }, [zoom]);

  // Add supplier markers when map is ready
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || suppliers.length === 0) return;

    const map = mapInstanceRef.current;

    // Clear existing markers (if any)
    map.markers.clear();

    // Create data source for markers
    const dataSource = new atlas.source.DataSource();
    map.sources.add(dataSource);

    // Add markers for each supplier
    suppliers.forEach((supplier) => {
      // Create point feature
      const point = new atlas.data.Feature(
        new atlas.data.Point([supplier.longitude, supplier.latitude]),
        {
          id: supplier.id,
          name: supplier.name,
          address: supplier.address,
          city: supplier.city,
          country: supplier.country,
        }
      );

      dataSource.add(point);

      // Create HTML marker
      const marker = new atlas.HtmlMarker({
        position: [supplier.longitude, supplier.latitude],
        htmlContent: `
          <div class="supplier-marker" data-id="${supplier.id}" style="
            background-color: #4C7D5D;
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background-color: white;
              border-radius: 50%;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            "></div>
          </div>
        `,
        popup: new atlas.Popup({
          content: `
            <div style="padding: 12px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #13343B;">
                ${supplier.name}
              </h3>
              ${supplier.address ? `<p style="margin: 4px 0; font-size: 14px; color: #626C71;">${supplier.address}</p>` : ''}
              ${supplier.city ? `<p style="margin: 4px 0; font-size: 14px; color: #626C71;">${supplier.city}${supplier.country ? `, ${supplier.country}` : ''}</p>` : ''}
            </div>
          `,
          pixelOffset: [0, -30],
        }),
      });

      // Add click event to marker
      map.events.add('click', marker, () => {
        marker.togglePopup();
        if (onSupplierClick) {
          onSupplierClick(supplier);
        }
      });

      // Add hover effect
      const markerElement = marker.getOptions().htmlContent as HTMLElement;
      if (markerElement) {
        markerElement.addEventListener('mouseenter', () => {
          markerElement.style.transform = 'rotate(-45deg) scale(1.2)';
        });
        markerElement.addEventListener('mouseleave', () => {
          markerElement.style.transform = 'rotate(-45deg) scale(1)';
        });
      }

      map.markers.add(marker);
    });

    // Fit map to show all suppliers
    if (suppliers.length > 0) {
      const positions = suppliers.map((s) => [s.longitude, s.latitude]);
      const bounds = atlas.data.BoundingBox.fromLatLngs(positions as atlas.data.Position[]);
      
      map.setCamera({
        bounds: bounds,
        padding: 50,
        maxZoom: 15,
      });
    }

    // Cleanup
    return () => {
      if (map.sources.getById(dataSource.getId())) {
        map.sources.remove(dataSource);
      }
    };
  }, [isMapReady, suppliers, onSupplierClick]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center p-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-gray-600 font-medium mb-2">Map Unavailable</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapRef} className="absolute inset-0 rounded-lg overflow-hidden" />
      
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {isMapReady && suppliers.length === 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-md">
          <p className="text-sm text-gray-600">No suppliers to display</p>
        </div>
      )}
    </div>
  );
};

export default SupplierMap;
