/**
 * API Router entry point in /api (project root level)
 */

import { Router } from 'express';
import { ltaCarparksHandler, LTA_DATAMALL_CARPARK_URL } from './lta';

export const apiRouter = Router();

// GET /api/carparks - Live carpark lots (HDB + LTA + URA) from LTA DataMall CarParkAvailabilityv2
apiRouter.get('/carparks', ltaCarparksHandler);

// GET /api/health - Endpoint health check & metadata
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ParkSG LTA API Proxy',
    endpoint: LTA_DATAMALL_CARPARK_URL,
    agenciesSupported: ['HDB', 'LTA', 'URA'],
    hasKey: Boolean(
      process.env.LTA_DATAMALL_KEY || 
      process.env.VITE_LTA_DATAMALL_KEY
    ),
    timestamp: new Date().toISOString(),
  });
});

export * from './lta';
