import React from 'react';
import { Carpark } from '../types/carpark';
import { Zap, Navigation, Clock, ShieldCheck, ChevronRight, AlertCircle } from 'lucide-react';

interface CarparkCardProps {
  carpark: Carpark;
  isSelected: boolean;
  onSelect: (carpark: Carpark) => void;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  isSelected,
  onSelect,
}) => {
  const isFull = carpark.availableLots <= 0;
  const isLow = carpark.availableLots > 0 && carpark.availableLots < 30;
  
  // Percentage available
  const percentAvailable = Math.min(
    100,
    Math.round((carpark.availableLots / Math.max(carpark.totalLots, 1)) * 100)
  );

  return (
    <div
      onClick={() => onSelect(carpark)}
      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative bg-white ${
        isSelected
          ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20 bg-emerald-50/20'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Header row: Agency tag, name, distance */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                carpark.agency === 'HDB'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {carpark.agency}
            </span>
            <span className="text-[11px] text-slate-500 truncate">{carpark.area}</span>
            {carpark.isCentralArea && (
              <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-medium border border-purple-100">
                Central Area
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-emerald-600">
            {carpark.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-1">{carpark.address}</p>
        </div>

        {/* Distance indicator */}
        {carpark.distanceKm !== undefined && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md shrink-0">
            <Navigation className="w-3 h-3 text-slate-400 rotate-45" />
            <span>{carpark.distanceKm} km</span>
          </div>
        )}
      </div>

      {/* Lot Availability Meter */}
      <div className="my-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isFull ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            <span className="font-bold text-slate-900 text-sm">
              {carpark.availableLots}
            </span>
            <span className="text-slate-400 text-xs">/ {carpark.totalLots} lots</span>
          </div>
          <span
            className={`text-xs font-semibold ${
              isFull ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {isFull ? 'Carpark Full' : `${percentAvailable}% Available`}
          </span>
        </div>

        {/* Visual progress bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFull ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentAvailable}%` }}
          />
        </div>
      </div>

      {/* Rate & Features Footer */}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-600 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-semibold text-slate-900">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>${carpark.rates.perHourEst.toFixed(2)}/hr</span>
          </div>

          <span className="text-slate-300">·</span>
          <span className="text-[11px] text-slate-500 truncate max-w-[130px]" title={carpark.rates.summary}>
            {carpark.rates.summary}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {carpark.evChargers && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
              title={`${carpark.evChargers.available} EV chargers available (${carpark.evChargers.provider})`}
            >
              <Zap className="w-3 h-3 text-blue-600" />
              <span>{carpark.evChargers.available} EV</span>
            </span>
          )}

          {carpark.hasFreeParkingScheme && (
            <span
              className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
              title="Free parking scheme available on Sundays/PH"
            >
              Sun Free
            </span>
          )}

          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
        </div>
      </div>
    </div>
  );
};
