import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '@/lib/prayerTimes';

interface LocationMapProps {
  location: Location;
  onLocationChange: (location: Location) => void;
}

export function LocationMap({ location, onLocationChange }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [location.latitude, location.longitude],
      zoom: 4,
      zoomControl: true,
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Custom marker icon
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        background: hsl(158 45% 25%);
        border: 3px solid hsl(43 80% 55%);
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Add marker
    const marker = L.marker([location.latitude, location.longitude], {
      icon: markerIcon,
      draggable: true,
    }).addTo(map);

    // Handle marker drag
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onLocationChange({
        latitude: pos.lat,
        longitude: pos.lng,
      });
    });

    // Handle map click
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onLocationChange({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position when location prop changes
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const newLatLng = L.latLng(location.latitude, location.longitude);
      markerRef.current.setLatLng(newLatLng);
      mapInstanceRef.current.setView(newLatLng, mapInstanceRef.current.getZoom());
    }
  }, [location.latitude, location.longitude]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[200px] rounded-xl overflow-hidden border border-border"
      style={{ zIndex: 1 }}
    />
  );
}
