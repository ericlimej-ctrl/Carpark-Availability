export type AgencyType = 'LTA' | 'HDB' | 'URA';
export type LotType = 'C' | 'H' | 'Y'; // C: Car, H: Heavy Vehicle, Y: Motorcycle
export type CarparkCategory = 'Shopping Mall' | 'Commercial & Office' | 'HDB Residential' | 'Transit & Airport' | 'Hospital & Civic' | 'Hotel & Resort';

export interface RateRule {
  firstHourWeekday: number;
  subsequentHalfHourWeekday: number;
  perEntryEveningWeekday?: number;
  eveningCutoffHour?: number; // e.g. 17 (5pm) or 18 (6pm)
  firstHourWeekend: number;
  subsequentHalfHourWeekend: number;
  perEntryWeekendEvening?: number;
  sundayFreeHours?: { start: number; end: number }; // e.g. 7.5 to 22.5
  centralAreaHdb?: boolean;
}

export interface EVStation {
  available: number;
  total: number;
  fastCharging: boolean;
  powerKw: number;
  provider: 'SP Mobility' | 'Charge+' | 'Tesla Supercharger' | 'Shell Recharge' | 'ComfortDelGro Engie' | 'City Energy Go';
}

export interface Carpark {
  id: string; // e.g. LTA ID or HDB Carpark Number
  name: string;
  agency: AgencyType;
  category: CarparkCategory;
  area: 'Orchard' | 'Marina Bay' | 'Downtown / CBD' | 'Tampines' | 'Jurong' | 'Bedok' | 'Woodlands' | 'Bugis' | 'Harbourfront' | 'Changi' | 'Bishan / Ang Mo Kio';
  address: string;
  postalCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  availableLots: number;
  totalLots: number;
  lotType: LotType;
  heightLimit?: number; // in meters e.g. 2.1
  gracePeriodMinutes: number; // e.g. 10 or 15 mins
  isCentralArea: boolean;
  hasFreeParkingScheme?: boolean;
  evChargers?: EVStation;
  rates: {
    weekdayDay: string;
    weekdayEvening: string;
    saturday: string;
    sundayHoliday: string;
    perHourEst: number; // representative per hour cost for quick sorting
    summary: string;
    rule: RateRule;
  };
  lotsBreakdown?: {
    car: { available: number; total: number };
    motorcycle?: { available: number; total: number };
    heavy?: { available: number; total: number };
  };
  distanceKm?: number;
  lastUpdated: string;
}

export interface UserLocation {
  name: string;
  lat: number;
  lng: number;
  isCustomGps?: boolean;
}

export interface FilterOptions {
  agency: 'ALL' | 'LTA' | 'HDB' | 'URA';
  vehicleType: 'C' | 'Y' | 'H';
  minLots: number;
  evOnly: boolean;
  maxRatePerHour?: number;
  highClearanceOnly: boolean; // >= 2.0m
  searchQuery: string;
  sortBy: 'availability' | 'distance' | 'price' | 'name';
  sortOrder: 'asc' | 'desc';
}

export interface ApiStatus {
  source: 'mock' | 'lta_live' | 'datagov_live';
  status: 'online' | 'fallback' | 'loading' | 'error';
  lastSyncTime: Date;
  ltaKeyConfigured: boolean;
  dataGovKeyConfigured: boolean;
  itemCount: number;
  message?: string;
}
