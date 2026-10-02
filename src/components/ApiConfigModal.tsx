import React, { useState } from 'react';
import { 
  X, 
  Code2, 
  Key, 
  Database, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  Copy, 
  Check,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { ApiStatus } from '../types/carpark';
import { LTA_DATAMALL_ENDPOINT, DATA_GOV_SG_ENDPOINT } from '../services/carparkApi';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiStatus: ApiStatus;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  apiStatus,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleEnvConfig = `# .env file configuration
VITE_USE_MOCK_DATA="false"
VITE_LTA_DATAMALL_KEY="YOUR_LTA_DATAMALL_ACCOUNT_KEY"
VITE_DATA_GOV_SG_API_KEY=""`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <Code2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                API Integration & Architecture
              </h2>
              <p className="text-xs text-slate-500">
                1-File Swap Layer: Singapore LTA DataMall & data.gov.sg
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs">
          
          {/* Active Status Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
            <div className="mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-sm">
                  Active Mode: {apiStatus.source === 'lta_live' ? 'LTA DataMall Live API' : 'High-Fidelity Singapore Mock Layer'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Ready
                </span>
              </div>
              <p className="text-slate-600 mt-1 text-xs">
                The application currently reads from <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]">src/services/carparkApi.ts</code>.
                When you obtain your LTA DataMall AccountKey, changing to live telemetry requires updating only the environment variables or modifying that single file.
              </p>
            </div>
          </div>

          {/* Quick 1-File Swap Instructions */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-emerald-600" />
              <span>How To Enable Live Production Telemetry</span>
            </h4>
            
            <div className="space-y-2 text-slate-600">
              <p>
                1. <strong>Register AccountKey:</strong> Request a free developer key at the{' '}
                <a
                  href="https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline font-medium inline-flex items-center gap-0.5"
                >
                  LTA DataMall Portal <ExternalLink className="w-3 h-3 inline" />
                </a>.
              </p>
              <p>
                2. <strong>Set Environment Variables:</strong> In your <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env</code> file, set:
              </p>
            </div>

            <div className="relative mt-2">
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                {sampleEnvConfig}
              </pre>
              <button
                onClick={() => copyToClipboard(sampleEnvConfig, 'env')}
                className="absolute top-2.5 right-2.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-medium flex items-center gap-1 transition-colors"
              >
                {copiedKey === 'env' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'env' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Data Sources, Terms & Rate Limits Specification */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Singapore Data Sources, Rate Limits & Terms</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* LTA DataMall */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">LTA DataMall</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-medium">Commercial Malls</span>
                </div>
                <div className="text-[11px] space-y-1 text-slate-600">
                  <p><strong>Endpoint:</strong> <code className="text-slate-800 break-all">{LTA_DATAMALL_ENDPOINT}</code></p>
                  <p><strong>Header:</strong> <code className="text-slate-800">AccountKey: &lt;YOUR_KEY&gt;</code></p>
                  <p><strong>Rate Limit:</strong> 5,000,000 calls/month (fair usage).</p>
                  <p><strong>Update Frequency:</strong> Every 1 minute.</p>
                  <p><strong>Terms:</strong> Free for commercial and non-commercial apps under LTA DataMall API Terms.</p>
                </div>
              </div>

              {/* Data.gov.sg */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Data.gov.sg</span>
                  <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded font-medium">HDB Carparks</span>
                </div>
                <div className="text-[11px] space-y-1 text-slate-600">
                  <p><strong>Endpoint:</strong> <code className="text-slate-800 break-all">{DATA_GOV_SG_ENDPOINT}</code></p>
                  <p><strong>Header:</strong> <code className="text-slate-800">x-api-key (Optional)</code></p>
                  <p><strong>Rate Limit:</strong> Open access with standard government gateway throttles.</p>
                  <p><strong>Update Frequency:</strong> Every 1 minute.</p>
                  <p><strong>Terms:</strong> Singapore Open Data Licence.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Unified Schema Mapping */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1.5">
              Unified ParkSG Payload Representation
            </h5>
            <p className="text-[11px] text-slate-500 mb-2">
              Our service transforms disparate schemas (LTA <code className="text-slate-700">AvailableLots</code> &amp; Data.gov.sg SVY21 coordinate carpark items) into a unified TypeScript interface with full tariff calculation models.
            </p>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono bg-white p-2 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-slate-700">LTA Field</p>
                <p className="text-slate-500">CarParkID</p>
                <p className="text-slate-500">AvailableLots</p>
                <p className="text-slate-500">Location ("lat lng")</p>
              </div>
              <div>
                <p className="font-bold text-slate-700">data.gov.sg</p>
                <p className="text-slate-500">carpark_number</p>
                <p className="text-slate-500">lots_available</p>
                <p className="text-slate-500">x_coord, y_coord</p>
              </div>
              <div>
                <p className="font-bold text-emerald-700">ParkSG Unified</p>
                <p className="text-emerald-600">id: string</p>
                <p className="text-emerald-600">availableLots: number</p>
                <p className="text-emerald-600">coordinates: &#123;lat, lng&#125;</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Current file: <code className="font-mono text-slate-700">src/services/carparkApi.ts</code>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
