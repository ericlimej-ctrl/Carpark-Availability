import React from 'react';
import { 
  Car, 
  MapPin, 
  RefreshCw, 
  Code2, 
  Navigation2, 
  Sparkles,
  Zap,
  Building2
} from 'lucide-react';
import { ApiStatus, UserLocation } from '../types/carpark';

interface HeaderProps {
  apiStatus: ApiStatus;
  userLocation: UserLocation;
  onSelectLocation: (loc: UserLocation) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenApiModal: () => void;
  countdown: number;
}

export const PRESET_LOCATIONS: UserLocation[] = [
  { name: 'All Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Orchard Road', lat: 1.3048, lng: 103.8318 },
  { name: 'Marina Bay', lat: 1.2847, lng: 103.8610 },
  { name: 'Raffles Place / CBD', lat: 1.2830, lng: 103.8510 },
  { name: 'Jurong East', lat: 1.3329, lng: 103.7436 },
  { name: 'Tampines', lat: 1.3525, lng: 103.9447 },
];

export const Header: React.FC<HeaderProps> = ({
  apiStatus,
  userLocation,
  onSelectLocation,
  onRefresh,
  isRefreshing,
  onOpenApiModal,
  countdown,
}) => {
  const handleUseCurrentGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onSelectLocation({
            name: 'Current GPS Location',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            isCustomGps: true,
          });
        },
        (err) => {
          console.warn('Geolocation failed or denied:', err);
          alert('Could not retrieve GPS location. Please allow browser location access or select a preset Singapore area.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner / Branding & Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Park<span className="text-emerald-600">SG</span>
                </h1>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Live SG Lots & Rates
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                LTA Commercial Malls & HDB MSCP Real-Time Availability & Fee Estimator
              </p>
            </div>
          </div>

          {/* Telemetry Status & Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Live Polling Sync Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-600 font-medium">
                {apiStatus.source === 'lta_live' ? 'LTA DataMall Live' : 'Live Mock Telemetry'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 text-[11px]">Sync in {countdown}s</span>
              
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh carpark availability now"
                className="ml-1 p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>

            {/* API Specs / One-File Swap Info Button */}
            <button
              onClick={onOpenApiModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-500" />
              <span>API Integration Layer</span>
            </button>
          </div>
        </div>

        {/* Location Selector Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1 text-slate-500 shrink-0 font-medium mr-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Near:</span>
          </div>

          {PRESET_LOCATIONS.map((loc) => {
            const isSelected = userLocation.name === loc.name;
            return (
              <button
                key={loc.name}
                onClick={() => onSelectLocation(loc)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {loc.name}
              </button>
            );
          })}

          <button
            onClick={handleUseCurrentGps}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              userLocation.isCustomGps
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Navigation2 className="w-3 h-3" />
            <span>{userLocation.isCustomGps ? 'Your Location' : 'Use My GPS'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
