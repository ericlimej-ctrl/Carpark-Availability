import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, UserLocation } from '../types/carpark';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  userLocation: UserLocation;
}

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  userLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Singapore
    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 12,
      zoomControl: false,
    });

    // Add CartoDB Voyager tiles (clean, high contrast, non-commercial open friendly)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }
    ).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer group for carpark markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // Custom pulse marker for user location
    const userIcon = L.divIcon({
      className: 'user-location-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute w-8 h-8 rounded-full bg-blue-500 opacity-25 animate-ping"></span>
          <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000,
    })
      .addTo(map)
      .bindPopup(
        `<div class="p-1 font-sans text-xs">
          <p class="font-bold text-slate-800">Your Reference Location</p>
          <p class="text-slate-500">${userLocation.name}</p>
        </div>`
      );

    // If it's a specific location and no carpark selected, pan to it
    if (!selectedCarpark && userLocation.name !== 'All Singapore') {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.8 });
    }
  }, [userLocation]);

  // Update Carpark Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    carparks.forEach((cp) => {
      const isSelected = selectedCarpark?.id === cp.id;
      const isFull = cp.availableLots <= 0;
      const isLow = cp.availableLots > 0 && cp.availableLots < 30;
      
      // Pin styling based on lot availability
      let bgClass = 'bg-emerald-600 text-white';
      let borderClass = 'border-emerald-700';
      if (isFull) {
        bgClass = 'bg-rose-600 text-white';
        borderClass = 'border-rose-700';
      } else if (isLow) {
        bgClass = 'bg-amber-500 text-white';
        borderClass = 'border-amber-600';
      }

      const activeRing = isSelected
        ? 'ring-4 ring-emerald-400 ring-offset-2 scale-110 z-50'
        : 'hover:scale-105';

      const evBadge = cp.evChargers
        ? `<span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-white shadow-xs">⚡</span>`
        : '';

      const agencyTag = cp.agency === 'HDB' ? 'HDB' : 'MALL';

      const customHtml = `
        <div class="cursor-pointer transition-transform duration-200 ${activeRing} flex flex-col items-center">
          <div class="px-2 py-1 rounded-lg ${bgClass} shadow-md border ${borderClass} flex items-center gap-1.5 font-sans relative">
            <span class="text-[9px] font-bold px-1 py-0.2 bg-black/20 rounded">${agencyTag}</span>
            <span class="text-xs font-bold whitespace-nowrap">${cp.availableLots}</span>
            ${evBadge}
          </div>
          <div class="w-1.5 h-1.5 -mt-0.5 rotate-45 ${bgClass} border-r border-b ${borderClass}"></div>
        </div>
      `;

      const markerIcon = L.divIcon({
        className: 'custom-carpark-pin',
        html: customHtml,
        iconSize: [60, 36],
        iconAnchor: [30, 36],
      });

      const marker = L.marker([cp.coordinates.lat, cp.coordinates.lng], {
        icon: markerIcon,
        zIndexOffset: isSelected ? 900 : 100,
      });

      // Marker click opens popup & triggers selection
      marker.on('click', () => {
        onSelectCarpark(cp);
      });

      marker.bindPopup(
        `
        <div class="p-1 font-sans text-xs min-w-[210px]">
          <div class="flex items-center justify-between mb-1 pb-1 border-b border-slate-100">
            <span class="font-bold text-slate-900 text-sm leading-tight">${cp.name}</span>
          </div>
          <p class="text-slate-500 text-[11px] mb-2">${cp.address}</p>
          
          <div class="flex items-center justify-between bg-slate-50 p-2 rounded-md mb-2 border border-slate-200">
            <div>
              <p class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Lots Available</p>
              <p class="text-base font-bold ${isFull ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}">
                ${cp.availableLots} <span class="text-xs font-normal text-slate-400">/ ${cp.totalLots}</span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tariff</p>
              <p class="text-xs font-bold text-slate-800">$${cp.rates.perHourEst.toFixed(2)}/hr</p>
            </div>
          </div>

          ${cp.evChargers ? `
            <div class="flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 px-2 py-1 rounded mb-2">
              <span>⚡ ${cp.evChargers.available} EV Lots Free (${cp.evChargers.provider})</span>
            </div>
          ` : ''}

          <button id="view-details-${cp.id}" class="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded transition-colors text-center block">
            Calculate Fees & Details →
          </button>
        </div>
        `,
        { closeButton: true, offset: [0, -28] }
      );

      marker.addTo(markersLayer);
    });
  }, [carparks, selectedCarpark, onSelectCarpark]);

  // Center on selected carpark when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCarpark) return;

    map.flyTo(
      [selectedCarpark.coordinates.lat, selectedCarpark.coordinates.lng],
      15,
      { duration: 0.7 }
    );
  }, [selectedCarpark]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Legend */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-200/80 shadow-sm text-xs hidden sm:block">
        <p className="font-semibold text-slate-800 text-[11px] mb-1.5">Availability Legend</p>
        <div className="flex flex-col gap-1 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Plenty (&gt;30 lots)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Filling up (&lt;30 lots)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>Full / Crowded</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-blue-600 font-bold">⚡</span>
            <span>EV Charging Available</span>
          </div>
        </div>
      </div>

      {/* Re-center Singapore control button */}
      <div className="absolute top-3 right-3 z-[400]">
        <button
          onClick={() => {
            const map = mapInstanceRef.current;
            if (map) {
              map.flyTo([1.3521, 103.8198], 12, { duration: 0.8 });
            }
          }}
          className="bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-medium flex items-center gap-1 transition-colors"
          title="Zoom to Singapore Island Overview"
        >
          <span>🇸🇬 Reset View</span>
        </button>
      </div>
    </div>
  );
};
