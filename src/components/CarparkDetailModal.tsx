import React, { useState } from 'react';
import { Carpark } from '../types/carpark';
import { calculateParkingFee } from '../utils/rateCalculator';
import { 
  X, 
  MapPin, 
  Clock, 
  Navigation, 
  Calculator, 
  Zap, 
  ShieldCheck, 
  Car, 
  Bike, 
  ExternalLink,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

interface CarparkDetailModalProps {
  carpark: Carpark | null;
  onClose: () => void;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
}) => {
  if (!carpark) return null;

  // Rate calculator state
  const [arrivalDate, setArrivalDate] = useState<Date>(new Date());
  const [durationMinutes, setDurationMinutes] = useState<number>(120); // 2 hours default
  const [vehicleType, setVehicleType] = useState<'C' | 'Y'>('C');

  // Compute fee
  const feeResult = calculateParkingFee(carpark, arrivalDate, durationMinutes, vehicleType);

  // Quick preset arrival times
  const setQuickArrival = (type: 'now' | 'tonight' | 'saturday' | 'sunday') => {
    const d = new Date();
    if (type === 'tonight') {
      d.setHours(19, 0, 0, 0); // 7:00 PM tonight
    } else if (type === 'saturday') {
      const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + daysUntilSat);
      d.setHours(14, 0, 0, 0); // 2:00 PM Saturday
    } else if (type === 'sunday') {
      const daysUntilSun = (7 - d.getDay()) % 7 || 7;
      d.setDate(d.getDate() + daysUntilSun);
      d.setHours(11, 0, 0, 0); // 11:00 AM Sunday
    }
    setArrivalDate(new Date(d));
  };

  const isFull = carpark.availableLots <= 0;
  const isLow = carpark.availableLots > 0 && carpark.availableLots < 30;
  const percentAvailable = Math.min(
    100,
    Math.round((carpark.availableLots / Math.max(carpark.totalLots, 1)) * 100)
  );

  // Navigation Links
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`;
  const wazeUrl = `https://waze.com/ul?ll=${carpark.coordinates.lat},${carpark.coordinates.lng}&navigate=yes`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${carpark.coordinates.lat},${carpark.coordinates.lng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
                  carpark.agency === 'HDB'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {carpark.agency} CARPARK
              </span>
              <span className="text-xs text-slate-500 font-medium">{carpark.category}</span>
              {carpark.isCentralArea && (
                <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Central Area (CBD)
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {carpark.name}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{carpark.address}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Real-time lot status & key badges */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Live Available Lots
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-extrabold ${isFull ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {carpark.availableLots}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ {carpark.totalLots} total capacity</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {percentAvailable}% Vacant
                  </span>
                </div>
              </div>

              {/* Quick specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Height Limit</span>
                  <span className="font-bold text-slate-800">{carpark.heightLimit ? `${carpark.heightLimit} m` : 'Standard (2.0m)'}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Grace Period</span>
                  <span className="font-bold text-emerald-700">{carpark.gracePeriodMinutes} mins free</span>
                </div>
                {carpark.evChargers && (
                  <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-blue-600 block">EV Chargers</span>
                    <span className="font-bold text-blue-900">{carpark.evChargers.available} / {carpark.evChargers.total} Available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isFull ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${percentAvailable}%` }}
              />
            </div>
          </div>

          {/* Rate Calculator Section */}
          <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Parking Fee Calculator</h3>
                  <p className="text-[11px] text-slate-500">Accurate Singapore tariff calculation</p>
                </div>
              </div>

              {/* Vehicle selector */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setVehicleType('C')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    vehicleType === 'C' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Car</span>
                </button>
                <button
                  onClick={() => setVehicleType('Y')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    vehicleType === 'Y' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Motorcycle</span>
                </button>
              </div>
            </div>

            {/* Arrival Time Quick Presets */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">Arrival Time:</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {arrivalDate.toLocaleDateString('en-SG', { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                  {arrivalDate.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  onClick={() => setQuickArrival('now')}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium shrink-0"
                >
                  Now
                </button>
                <button
                  onClick={() => setQuickArrival('tonight')}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium shrink-0"
                >
                  Tonight 7 PM
                </button>
                <button
                  onClick={() => setQuickArrival('saturday')}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium shrink-0"
                >
                  Sat Afternoon
                </button>
                <button
                  onClick={() => setQuickArrival('sunday')}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium shrink-0"
                >
                  Sun 11 AM
                </button>
              </div>
            </div>

            {/* Parking Duration Stepper & Slider */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">Planned Duration:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {durationMinutes < 60 ? `${durationMinutes} mins` : `${(durationMinutes / 60).toFixed(1)} hrs (${durationMinutes} mins)`}
                </span>
              </div>
              
              <input
                type="range"
                min="10"
                max="480"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />

              <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500">
                {[15, 30, 60, 120, 180, 240, 360].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setDurationMinutes(mins)}
                    className={`px-1.5 py-0.5 rounded transition-colors ${
                      durationMinutes === mins ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-emerald-100'
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculation Output Box */}
            <div className="bg-white border border-emerald-300 rounded-xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Estimated Parking Fee
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-extrabold text-emerald-700">
                      S${feeResult.totalFee.toFixed(2)}
                    </span>
                    {feeResult.isGracePeriod && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Grace Period Applied
                      </span>
                    )}
                    {feeResult.isFreePeriod && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Sunday Free Parking
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono">
                  <p>In: {feeResult.entryDate.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>Out: {feeResult.exitDate.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              {/* Calculation step-by-step breakdown */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Calculation Breakdown:</span>
                {feeResult.breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-emerald-600 text-xs">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Official Tariff Schedule Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Standard Tariff Schedule</span>
            </h4>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full divide-y divide-slate-200">
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="px-3.5 py-2.5 font-medium text-slate-500 bg-slate-50 w-1/3">
                      Weekday Day
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-800">
                      {carpark.rates.weekdayDay}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2.5 font-medium text-slate-500 bg-slate-50">
                      Weekday Evening
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-800">
                      {carpark.rates.weekdayEvening}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2.5 font-medium text-slate-500 bg-slate-50">
                      Saturday
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-800">
                      {carpark.rates.saturday}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2.5 font-medium text-slate-500 bg-slate-50">
                      Sunday &amp; PH
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-800">
                      {carpark.rates.sundayHoliday}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* EV Charging Station Info */}
          {carpark.evChargers && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>Electric Vehicle (EV) Charging Station</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Operated by <strong>{carpark.evChargers.provider}</strong>. {carpark.evChargers.powerKw}kW {carpark.evChargers.fastCharging ? 'Fast DC Charger' : 'Standard AC Charger'}. 
                Current status: <strong>{carpark.evChargers.available} of {carpark.evChargers.total}</strong> charging bays vacant.
              </p>
            </div>
          )}

        </div>

        {/* Footer / Deep Link Launchers */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>Coordinates: </span>
            <span className="font-mono text-slate-700">{carpark.coordinates.lat.toFixed(4)}, {carpark.coordinates.lng.toFixed(4)}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <span>Waze</span>
              <ExternalLink className="w-3 h-3 text-blue-300" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
