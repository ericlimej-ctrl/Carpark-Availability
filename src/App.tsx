import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Carpark, FilterOptions, UserLocation, ApiStatus } from './types/carpark';
import { 
  fetchCarparks, 
  simulateTelemetryUpdate, 
  getApiConfiguration 
} from './services/carparkApi';
import { calculateDistanceKm } from './utils/rateCalculator';
import { Header, PRESET_LOCATIONS } from './components/Header';
import { CarparkMap } from './components/CarparkMap';
import { CarparkList } from './components/CarparkList';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { ApiConfigModal } from './components/ApiConfigModal';
import { Map, List, Layers, ShieldCheck, HelpCircle } from 'lucide-react';

export default function App() {
  const [carparks, setCarparks] = useState<Carpark[]>([]);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');
  const [countdown, setCountdown] = useState(60);

  // Reference User Location (defaults to Orchard Road for immediate realistic distance rankings)
  const [userLocation, setUserLocation] = useState<UserLocation>(PRESET_LOCATIONS[1]);

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    agency: 'ALL',
    vehicleType: 'C',
    minLots: 0,
    evOnly: false,
    highClearanceOnly: false,
    searchQuery: '',
    sortBy: 'distance',
    sortOrder: 'asc',
  });

  // API Config Status
  const [apiStatus, setApiStatus] = useState<ApiStatus>(getApiConfiguration());

  // Load initial data
  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const res = await fetchCarparks();
      setCarparks(res.carparks);
      setApiStatus(prev => ({
        ...prev,
        source: res.source,
        lastSyncTime: new Date(),
        itemCount: res.carparks.length,
      }));
    } catch (err) {
      console.error('Failed to load carparks:', err);
    } finally {
      setIsRefreshing(false);
      setCountdown(60);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Telemetry auto-refresh countdown (updates every 60s like LTA DataMall)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Simulate telemetry refresh
          setCarparks(current => simulateTelemetryUpdate(current));
          setApiStatus(s => ({ ...s, lastSyncTime: new Date() }));
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update filters handler
  const handleUpdateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Select carpark handler
  const handleSelectCarpark = (cp: Carpark) => {
    setSelectedCarpark(cp);
    setIsDetailModalOpen(true);
  };

  // Calculate distances & filter carparks
  const processedCarparks = useMemo(() => {
    // 1. Calculate distance for each carpark
    const withDistance = carparks.map(cp => {
      const dist = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        cp.coordinates.lat,
        cp.coordinates.lng
      );
      return { ...cp, distanceKm: dist };
    });

    // 2. Apply filters
    const filtered = withDistance.filter(cp => {
      // Agency filter
      if (filters.agency !== 'ALL' && cp.agency !== filters.agency) {
        return false;
      }

      // Min lots available
      if (filters.minLots > 0 && cp.availableLots < filters.minLots) {
        return false;
      }

      // EV Only
      if (filters.evOnly && (!cp.evChargers || cp.evChargers.available <= 0)) {
        return false;
      }

      // High clearance
      if (filters.highClearanceOnly && (!cp.heightLimit || cp.heightLimit < 2.0)) {
        return false;
      }

      // Search query (name, address, area)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = cp.name.toLowerCase().includes(query);
        const matchAddress = cp.address.toLowerCase().includes(query);
        const matchArea = cp.area.toLowerCase().includes(query);
        const matchId = cp.id.toLowerCase().includes(query);
        if (!matchName && !matchAddress && !matchArea && !matchId) {
          return false;
        }
      }

      return true;
    });

    // 3. Apply sorting
    filtered.sort((a, b) => {
      if (filters.sortBy === 'distance') {
        return (a.distanceKm || 0) - (b.distanceKm || 0);
      }
      if (filters.sortBy === 'availability') {
        return b.availableLots - a.availableLots;
      }
      if (filters.sortBy === 'price') {
        return a.rates.perHourEst - b.rates.perHourEst;
      }
      if (filters.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return filtered;
  }, [carparks, userLocation, filters]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* App Header */}
      <Header
        apiStatus={apiStatus}
        userLocation={userLocation}
        onSelectLocation={setUserLocation}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        countdown={countdown}
      />

      {/* Mobile View Toggle Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-center">
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg w-full max-w-xs text-xs font-semibold">
          <button
            onClick={() => setMobileTab('map')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors ${
              mobileTab === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
          <button
            onClick={() => setMobileTab('list')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors ${
              mobileTab === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Carpark List ({processedCarparks.length})</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 flex flex-col md:flex-row gap-4 overflow-hidden">
        
        {/* Left Side: Carpark List & Filters */}
        <div className={`w-full md:w-[420px] lg:w-[460px] h-[calc(100vh-175px)] shrink-0 ${
          mobileTab === 'list' ? 'block' : 'hidden md:block'
        }`}>
          <CarparkList
            carparks={processedCarparks}
            selectedCarpark={selectedCarpark}
            onSelectCarpark={handleSelectCarpark}
            filters={filters}
            onUpdateFilters={handleUpdateFilters}
            totalUnfilteredCount={carparks.length}
          />
        </div>

        {/* Right Side: Leaflet Interactive Map */}
        <div className={`flex-1 h-[calc(100vh-175px)] ${
          mobileTab === 'map' ? 'block' : 'hidden md:block'
        }`}>
          <CarparkMap
            carparks={processedCarparks}
            selectedCarpark={selectedCarpark}
            onSelectCarpark={handleSelectCarpark}
            userLocation={userLocation}
          />
        </div>
      </main>

      {/* Carpark Detail & Fee Calculator Modal */}
      {isDetailModalOpen && (
        <CarparkDetailModal
          carpark={selectedCarpark}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}

      {/* API Configuration & Swap Modal */}
      <ApiConfigModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        apiStatus={apiStatus}
      />
    </div>
  );
}
