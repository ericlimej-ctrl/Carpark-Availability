import { Carpark } from '../types/carpark';

export interface FeeCalculationResult {
  totalFee: number;
  isGracePeriod: boolean;
  isFreePeriod: boolean;
  breakdown: string[];
  entryDate: Date;
  exitDate: Date;
  durationMinutes: number;
}

/**
 * Calculates estimated parking fee based on carpark rules, arrival time, and duration.
 */
export function calculateParkingFee(
  carpark: Carpark,
  arrivalDate: Date,
  durationMinutes: number,
  vehicleType: 'C' | 'Y' | 'H' = 'C'
): FeeCalculationResult {
  const exitDate = new Date(arrivalDate.getTime() + durationMinutes * 60000);
  const breakdown: string[] = [];

  // 1. Check Grace Period
  if (durationMinutes <= carpark.gracePeriodMinutes) {
    return {
      totalFee: 0,
      isGracePeriod: true,
      isFreePeriod: false,
      breakdown: [
        `Stayed ${durationMinutes} mins (within ${carpark.gracePeriodMinutes}-min grace period)`,
        `Grace period deduction: -$0.00`,
      ],
      entryDate: arrivalDate,
      exitDate,
      durationMinutes,
    };
  }

  // Handle Motorcycle flat / per-entry rate
  if (vehicleType === 'Y') {
    if (carpark.agency === 'HDB' || carpark.agency === 'URA') {
      // HDB motorcycle is $0.65 per whole day or per entry
      return {
        totalFee: 0.65,
        isGracePeriod: false,
        isFreePeriod: false,
        breakdown: [
          `Motorcycle parking (HDB/URA Standard rate)`,
          `$0.65 per entry / 24-hour block`,
        ],
        entryDate: arrivalDate,
        exitDate,
        durationMinutes,
      };
    } else {
      // Commercial mall motorcycle rate typically $1.50 - $2.50 per entry
      const motoFee = Math.min(2.5, carpark.rates.perHourEst * 0.5);
      return {
        totalFee: Number(motoFee.toFixed(2)),
        isGracePeriod: false,
        isFreePeriod: false,
        breakdown: [
          `Motorcycle parking rate`,
          `Estimated $${motoFee.toFixed(2)} per entry`,
        ],
        entryDate: arrivalDate,
        exitDate,
        durationMinutes,
      };
    }
  }

  const dayOfWeek = arrivalDate.getDay(); // 0 is Sunday, 6 is Saturday
  const rule = carpark.rates.rule;
  const arrivalHour = arrivalDate.getHours() + arrivalDate.getMinutes() / 60;
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;

  // 2. Check Sunday Free Parking Scheme (HDB)
  if (isSunday && carpark.hasFreeParkingScheme && rule.sundayFreeHours) {
    if (arrivalHour >= rule.sundayFreeHours.start && arrivalHour <= rule.sundayFreeHours.end) {
      const exitHour = exitDate.getHours() + exitDate.getMinutes() / 60;
      if (exitHour <= rule.sundayFreeHours.end) {
        return {
          totalFee: 0,
          isGracePeriod: false,
          isFreePeriod: true,
          breakdown: [
            `Sunday Free Parking Scheme (7:30 AM – 10:30 PM)`,
            `Total fee: $0.00`,
          ],
          entryDate: arrivalDate,
          exitDate,
          durationMinutes,
        };
      }
    }
  }

  // 3. HDB / URA Standard Calculation
  if (carpark.agency === 'HDB') {
    const halfHours = Math.ceil(durationMinutes / 30);
    const ratePerHalfHour = carpark.isCentralArea && arrivalHour >= 7 && arrivalHour < 17 ? 1.2 : 0.6;
    const rateTitle = carpark.isCentralArea && arrivalHour >= 7 && arrivalHour < 17
      ? 'HDB Central Area Peak ($1.20 / 30 mins)'
      : 'HDB Standard Rate ($0.60 / 30 mins)';
    
    let total = halfHours * ratePerHalfHour;
    
    // Overnight cap check (HDB overnight is capped at $5 from 10:30pm to 7am)
    if (arrivalHour >= 22.5 || arrivalHour < 7) {
      total = Math.min(total, 5.0);
    }

    breakdown.push(`Agency: Housing & Development Board (HDB)`);
    breakdown.push(`Total billed units: ${halfHours} × 30-min block(s)`);
    breakdown.push(`Applied Tariff: ${rateTitle}`);

    return {
      totalFee: Number(total.toFixed(2)),
      isGracePeriod: false,
      isFreePeriod: false,
      breakdown,
      entryDate: arrivalDate,
      exitDate,
      durationMinutes,
    };
  }

  // 4. Commercial / Mall / LTA Rates Calculation
  const isWeekend = isSaturday || isSunday;
  const firstHourRate = isWeekend ? rule.firstHourWeekend : rule.firstHourWeekday;
  const subsqRate = isWeekend ? rule.subsequentHalfHourWeekend : rule.subsequentHalfHourWeekday;
  const cutoffHour = rule.eveningCutoffHour || 17;
  const perEntryEvening = isWeekend ? (rule.perEntryWeekendEvening || rule.perEntryEveningWeekday) : rule.perEntryEveningWeekday;

  // Check evening per entry
  if (perEntryEvening && arrivalHour >= cutoffHour) {
    breakdown.push(`Entry at ${formatTime(arrivalDate)} (After ${cutoffHour}:00 Evening cutoff)`);
    breakdown.push(`Flat evening entry tariff applied: $${perEntryEvening.toFixed(2)}`);
    return {
      totalFee: Number(perEntryEvening.toFixed(2)),
      isGracePeriod: false,
      isFreePeriod: false,
      breakdown,
      entryDate: arrivalDate,
      exitDate,
      durationMinutes,
    };
  }

  // Standard progressive rate: 1st hour + subsequent 30-minute intervals
  let computedFee = 0;
  if (durationMinutes <= 60) {
    computedFee = firstHourRate;
    breakdown.push(`First 1 hour or part thereof: $${firstHourRate.toFixed(2)}`);
  } else {
    computedFee = firstHourRate;
    const remainingMinutes = durationMinutes - 60;
    const remainingHalfHours = Math.ceil(remainingMinutes / 30);
    const subsqCost = remainingHalfHours * subsqRate;
    computedFee += subsqCost;

    breakdown.push(`First 1 hour: $${firstHourRate.toFixed(2)}`);
    breakdown.push(`Next ${remainingMinutes} mins (${remainingHalfHours} × 30-min blocks @ $${subsqRate.toFixed(2)}): $${subsqCost.toFixed(2)}`);
  }

  // Check if session crosses into evening per-entry cap
  if (perEntryEvening && arrivalHour < cutoffHour && (exitDate.getHours() + exitDate.getMinutes() / 60) >= cutoffHour) {
    breakdown.push(`*Note: May be subject to evening transition per-entry depending on car park policy.`);
  }

  return {
    totalFee: Number(computedFee.toFixed(2)),
    isGracePeriod: false,
    isFreePeriod: false,
    breakdown,
    entryDate: arrivalDate,
    exitDate,
    durationMinutes,
  };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Calculates straight line distance in km between two lat/lng coordinates (Haversine)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}
