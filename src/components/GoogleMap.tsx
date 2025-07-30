import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Zap } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

interface GoogleMapProps {
  center: Location;
  zoom?: number;
  busLocation?: Location | null;
  busStops?: Array<{ id: string; name: string; lat: number; lng: number }>;
  showTraffic?: boolean;
  isLive?: boolean;
  driverName?: string;
  busNumber?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  center,
  zoom = 15,
  busLocation,
  busStops = [],
  showTraffic = true,
  isLive = false,
  driverName,
  busNumber
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [busMarker, setBusMarker] = useState<google.maps.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: center.lat, lng: center.lng },
      zoom,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    if (showTraffic) {
      const trafficLayer = new google.maps.TrafficLayer();
      trafficLayer.setMap(mapInstance);
    }

    setMap(mapInstance);
    setIsMapLoaded(true);
  }, [center, zoom, showTraffic]);

  // Add bus stops markers
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    busStops.forEach(stop => {
      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map,
        title: stop.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#059669',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div class="p-2"><strong>${stop.name}</strong><br/>Bus Stop</div>`
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });
  }, [map, busStops, isMapLoaded]);

  // Update bus location marker
  useEffect(() => {
    if (!map || !busLocation || !isMapLoaded) return;

    if (busMarker) {
      // Animate marker movement
      const newPosition = { lat: busLocation.lat, lng: busLocation.lng };
      busMarker.setPosition(newPosition);
      
      // Update map center to follow bus
      map.panTo(newPosition);
    } else {
      // Create new bus marker
      const marker = new google.maps.Marker({
        position: { lat: busLocation.lat, lng: busLocation.lng },
        map,
        title: `Bus ${busNumber || 'Unknown'} - ${driverName || 'Driver'}`,
        icon: {
          path: 'M12 2C13.1 2 14 2.9 14 4V6H18C19.1 6 20 6.9 20 8V18C20 19.1 19.1 20 18 20H16C16 21.1 15.1 22 14 22H10C8.9 22 8 21.1 8 20H6C4.9 20 4 19.1 4 18V8C4 6.9 4.9 6 6 6H10V4C10 2.9 10.9 2 12 2M12 4V6H12V4M6 8V18H8V16H16V18H18V8H6M8 10H16V14H8V10Z',
          fillColor: isLive ? '#dc2626' : '#6b7280',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.5,
          rotation: busLocation.heading || 0,
        },
        zIndex: 1000,
      });

      const infoContent = `
        <div class="p-3 min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 bg-red-500 rounded-full ${isLive ? 'animate-pulse' : ''}"></div>
            <strong>Bus ${busNumber || 'Unknown'}</strong>
          </div>
          <div class="text-sm text-gray-600">
            <div>Driver: ${driverName || 'Unknown'}</div>
            <div>Speed: ${busLocation.speed?.toFixed(1) || '0'} km/h</div>
            <div>Status: ${isLive ? 'Live Tracking' : 'Offline'}</div>
            <div class="text-xs mt-1">
              Last updated: ${new Date(busLocation.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      setBusMarker(marker);
    }

    setLastUpdate(new Date());
  }, [map, busLocation, isMapLoaded, isLive, driverName, busNumber, busMarker]);

  if (!window.google) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
          <p className="text-sm text-gray-500 mt-2">Please ensure you have internet connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Live Status Overlay */}
      {isLive && busLocation && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-red-600">LIVE</span>
            </div>
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              <span>{busLocation.speed?.toFixed(1) || '0'} km/h</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{busLocation.lat.toFixed(6)}, {busLocation.lng.toFixed(6)}</span>
            </div>
            <div className="text-xs text-gray-500">
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Bus Info Overlay */}
      {busLocation && driverName && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <div className="text-sm">
            <div className="font-semibold text-gray-800">Bus {busNumber}</div>
            <div className="text-gray-600">Driver: {driverName}</div>
            <div className={`text-xs mt-1 ${isLive ? 'text-green-600' : 'text-gray-500'}`}>
              {isLive ? 'Online & Tracking' : 'Offline'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;