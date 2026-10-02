import React from 'react';
import { Carpark, FilterOptions, AgencyType } from '../types/carpark';
import { CarparkCard } from './CarparkCard';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ArrowUpDown, 
  Building, 
  Zap, 
  Car, 
  Bike, 
  Maximize2
} from 'lucide-react';

interface CarparkListProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  filters: FilterOptions;
  onUpdateFilters: (newFilters: Partial<FilterOptions>) => void;
  totalUnfilteredCount: number;
}

export const CarparkList: React.FC<CarparkListProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  filters,
  onUpdateFilters,
  totalUnfilteredCount,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Search & Main Filter Bar */}
      <div className="p-3.5 border-b border-slate-200 space-y-2.5">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
            placeholder="Search carparks by mall, street, or area..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onUpdateFilters({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Agency Filter Chips */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5">
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
            {(['ALL', 'LTA', 'HDB'] as const).map((agency) => {
              const isActive = filters.agency === agency;
              const label = agency === 'ALL' ? 'All Carparks' : agency === 'LTA' ? 'Commercial Malls' : 'HDB MSCP';
              return (
                <button
                  key={agency}
                  onClick={() => onUpdateFilters({ agency })}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
              showAdvancedFilters || filters.evOnly || filters.highClearanceOnly || filters.minLots > 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {(filters.evOnly || filters.highClearanceOnly || filters.minLots > 0) && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            )}
          </button>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvancedFilters && (
          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium">Vehicle Type:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateFilters({ vehicleType: 'C' })}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    filters.vehicleType === 'C'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Car className="w-3 h-3" />
                  <span>Car</span>
                </button>
                <button
                  onClick={() => onUpdateFilters({ vehicleType: 'Y' })}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    filters.vehicleType === 'Y'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Bike className="w-3 h-3" />
                  <span>Motorcycle</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium">Min Available Lots:</span>
              <div className="flex items-center gap-1">
                {[0, 20, 50, 100].map((min) => (
                  <button
                    key={min}
                    onClick={() => onUpdateFilters({ minLots: min })}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      filters.minLots === min
                        ? 'bg-emerald-700 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {min === 0 ? 'Any' : `>${min}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.evOnly}
                  onChange={(e) => onUpdateFilters({ evOnly: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-blue-600" />
                  <span>EV Charging Only</span>
                </span>
              </label>

              <span className="text-slate-300">·</span>

              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.highClearanceOnly}
                  onChange={(e) => onUpdateFilters({ highClearanceOnly: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>High Clearance (&ge;2.0m)</span>
              </label>
            </div>
          </div>
        )}

        {/* Sort & Count Header */}
        <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
          <span>
            Showing <strong className="text-slate-900">{carparks.length}</strong> of{' '}
            {totalUnfilteredCount} carparks
          </span>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => onUpdateFilters({ sortBy: e.target.value as any })}
              className="bg-transparent text-xs text-slate-700 font-semibold cursor-pointer focus:outline-none pr-1"
            >
              <option value="distance">Nearest Distance</option>
              <option value="availability">Most Available Lots</option>
              <option value="price">Lowest Price ($/hr)</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Carpark Cards Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {carparks.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">No carparks found</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
              No carparks matched your current search and filter criteria. Try clearing filters.
            </p>
            <button
              onClick={() =>
                onUpdateFilters({
                  agency: 'ALL',
                  searchQuery: '',
                  minLots: 0,
                  evOnly: false,
                  highClearanceOnly: false,
                })
              }
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          carparks.map((cp) => (
            <CarparkCard
              key={cp.id}
              carpark={cp}
              isSelected={selectedCarpark?.id === cp.id}
              onSelect={onSelectCarpark}
            />
          ))
        )}
      </div>
    </div>
  );
};
