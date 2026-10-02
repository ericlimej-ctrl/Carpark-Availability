/**
 * LTA DataMall CarParkAvailabilityv2 API Module
 * Located in /api (project root level)
 * 
 * Target Endpoint:
 * Live carpark lots (HDB + LTA + URA):
 * https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
 * 
 * Returns real-time parking lot availability across Singapore government and commercial carparks:
 * - HDB (Housing & Development Board)
 * - LTA (Land Transport Authority)
 * - URA (Urban Redevelopment Authority)
 * 
 * Authentication:
 * Requires 'AccountKey' header.
 * 
 * Rate limits & Refresh cadence:
 * LTA updates lot figures every 1 minute.
 * To optimize performance and comply with rate limits, a 60-second in-memory cache is used.
 */

import { Request, Response } from 'express';

export const LTA_DATAMALL_CARPARK_URL = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export interface LtaRawCarparkItem {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // "latitude longitude" e.g. "1.293 103.857"
  AvailableLots: number | string;
  LotType: 'C' | 'H' | 'Y'; // C = Car, H = Heavy, Y = Motorcycle
  Agency: 'HDB' | 'LTA' | 'URA';
}

export interface LtaApiResponse {
  'odata.metadata'?: string;
  value: LtaRawCarparkItem[];
}

export interface NormalizedCarpark {
  id: string;
  name: string;
  area: string;
  agency: 'HDB' | 'LTA' | 'URA';
  category: 'HDB Residential' | 'Shopping Mall' | 'Commercial & Office';
  coordinates: {
    lat: number;
    lng: number;
  };
  availableLots: number;
  totalLots: number;
  lotType: 'C' | 'H' | 'Y';
  rates: {
    weekdayDay: string;
    weekdayEvening: string;
    saturday: string;
    sundayHoliday: string;
    perHourEst: number;
    summary: string;
    rule: {
      firstHourWeekday: number;
      subsequentHalfHourWeekday: number;
      perEntryEveningWeekday?: number;
      eveningCutoffHour?: number;
      firstHourWeekend: number;
      subsequentHalfHourWeekend: number;
      centralAreaHdb?: boolean;
    };
  };
  lastUpdated: string;
}

// In-memory server cache to respect LTA 1-minute data freshness
let cache: {
  timestamp: number;
  data: NormalizedCarpark[];
  rawCount: number;
} | null = null;

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Normalizes raw LTA item into standardized model
 */
export function normalizeLtaItem(item: LtaRawCarparkItem): NormalizedCarpark {
  const parts = item.Location ? item.Location.trim().split(/\s+/) : [];
  const lat = parts[0] ? parseFloat(parts[0]) : 1.3521;
  const lng = parts[1] ? parseFloat(parts[1]) : 103.8198;
  const lots = typeof item.AvailableLots === 'string' ? parseInt(item.AvailableLots, 10) : item.AvailableLots;
  const availableLots = isNaN(lots) ? 0 : Math.max(0, lots);
  const isCentral = item.Area === 'Marina' || item.Area === 'Orchard' || item.Area === 'Central' || item.Area === 'CBD';

  // Realistic total lots estimation if not provided by LTA feed
  const totalLots = Math.max(availableLots * 2, 180);

  // Agency specific pricing rule defaults
  const isHdb = item.Agency === 'HDB';
  const isUra = item.Agency === 'URA';

  return {
    id: `${item.Agency}-${item.CarParkID}`,
    name: item.Development || `${item.Agency} Carpark ${item.CarParkID}`,
    area: item.Area || 'Central',
    agency: item.Agency,
    category: isHdb ? 'HDB Residential' : 'Shopping Mall',
    coordinates: {
      lat: isNaN(lat) ? 1.3521 : lat,
      lng: isNaN(lng) ? 103.8198 : lng,
    },
    availableLots,
    totalLots,
    lotType: item.LotType || 'C',
    rates: isHdb
      ? {
          weekdayDay: isCentral ? '$1.20 / 30 mins (Central Area)' : '$0.60 / 30 mins',
          weekdayEvening: '$0.60 / 30 mins (max $5 overnight)',
          saturday: isCentral ? '$1.20 / 30 mins' : '$0.60 / 30 mins',
          sundayHoliday: 'Free Parking Scheme (7:30am - 10:30pm)',
          perHourEst: isCentral ? 2.40 : 1.20,
          summary: isCentral ? '$1.20 / 30m Central' : '$0.60 / 30m Standard',
          rule: {
            firstHourWeekday: isCentral ? 2.40 : 1.20,
            subsequentHalfHourWeekday: isCentral ? 1.20 : 0.60,
            firstHourWeekend: isCentral ? 2.40 : 1.20,
            subsequentHalfHourWeekend: isCentral ? 1.20 : 0.60,
            centralAreaHdb: isCentral,
          },
        }
      : {
          weekdayDay: '$2.60 for 1st hr, $1.30/subsq 30 mins',
          weekdayEvening: '$3.50 per entry (after 5pm)',
          saturday: '$2.60 for 1st 2 hrs',
          sundayHoliday: '$2.60 for 1st 2 hrs',
          perHourEst: 2.60,
          summary: '$2.60 / 1st hr · $3.50 Eve',
          rule: {
            firstHourWeekday: 2.60,
            subsequentHalfHourWeekday: 1.30,
            perEntryEveningWeekday: 3.50,
            eveningCutoffHour: 17,
            firstHourWeekend: 2.60,
            subsequentHalfHourWeekend: 1.30,
          },
        },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetches all pages of carpark availability from LTA DataMall (500 per page)
 */
export async function fetchAllLtaCarparks(apiKey: string): Promise<NormalizedCarpark[]> {
  const allItems: LtaRawCarparkItem[] = [];
  let skip = 0;
  const batchSize = 500;
  let hasMore = true;

  // Paginate through LTA's $skip query parameter (up to 5 pages max)
  while (hasMore && skip < 2500) {
    const url = `${LTA_DATAMALL_CARPARK_URL}?$skip=${skip}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccountKey': apiKey,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`LTA DataMall HTTP ${response.status}: ${response.statusText}`);
    }

    const json: LtaApiResponse = await response.json();
    const batch = json.value || [];
    allItems.push(...batch);

    if (batch.length < batchSize) {
      hasMore = false;
    } else {
      skip += batchSize;
    }
  }

  return allItems.map(normalizeLtaItem);
}

/**
 * Express handler for GET /api/carparks
 */
export async function ltaCarparksHandler(req: Request, res: Response) {
  const apiKey = 
    process.env.LTA_DATAMALL_KEY || 
    process.env.VITE_LTA_DATAMALL_KEY || 
    (req.headers['x-account-key'] as string);

  // Check cache first
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return res.json({
      success: true,
      source: 'lta_cache',
      endpoint: LTA_DATAMALL_CARPARK_URL,
      cached: true,
      cacheAgeSeconds: Math.round((now - cache.timestamp) / 1000),
      count: cache.data.length,
      data: cache.data,
    });
  }

  // If no API key configured, return informative status
  if (!apiKey || apiKey === 'YOUR_LTA_DATAMALL_ACCOUNT_KEY') {
    return res.status(200).json({
      success: true,
      source: 'unauthenticated',
      endpoint: LTA_DATAMALL_CARPARK_URL,
      message: 'LTA DataMall AccountKey not set in environment (LTA_DATAMALL_KEY). Using fallback prototype dataset.',
      requiresKey: true,
      data: [],
    });
  }

  try {
    const carparks = await fetchAllLtaCarparks(apiKey);

    // Save to cache
    cache = {
      timestamp: now,
      data: carparks,
      rawCount: carparks.length,
    };

    return res.json({
      success: true,
      source: 'lta_live',
      endpoint: LTA_DATAMALL_CARPARK_URL,
      count: carparks.length,
      timestamp: new Date().toISOString(),
      agencies: ['HDB', 'LTA', 'URA'],
      data: carparks,
    });
  } catch (error: any) {
    console.error('LTA DataMall CarParkAvailabilityv2 Error:', error);
    return res.status(502).json({
      success: false,
      source: 'lta_error',
      endpoint: LTA_DATAMALL_CARPARK_URL,
      error: error.message || 'Failed to fetch from LTA DataMall',
      cachedData: cache ? cache.data : null,
    });
  }
}
