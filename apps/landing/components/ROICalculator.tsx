import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { trackROICalculatorInteraction } from '../utils/analytics';

const useSmoothNumber = (target: number) => {
  const [display, setDisplay] = useState(target);
  useEffect(() => {
    let frameId: number;
    const loop = () => {
      setDisplay(prev => {
        const dist = target - prev;
        if (Math.abs(dist) < 0.5) return target;
        return prev + (dist * 0.15);
      });
      frameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frameId);
  }, [target]);
  return Math.floor(display);
};

const ROICalculator: React.FC = () => {
  const [volume, setVolume] = useState(2000);
  const [credit, setCredit] = useState(20000);
  const [crop, setCrop] = useState<'Tea' | 'Coffee' | 'Avocado'>('Tea');

  // Crop-specific loss factors: higher = more leakage risk in that supply chain
  const cropFactors: Record<string, number> = {
    'Tea': 1.8,
    'Coffee': 2.2,
    'Avocado': 2.5,
  };

  // Estimation: base leakage from volume + credit exposure, scaled by crop risk
  // These are directional estimates for lead-generation; not audited financials.
  const baseLoss = (volume * 800) + (credit * 150);
  const rawEstimatedLoss = Math.floor(baseLoss * cropFactors[crop]);
  const rawRecoverable = Math.floor(rawEstimatedLoss * 0.65);

  useEffect(() => {
    const timer = setTimeout(() => {
      api.analytics.logROIInteraction({
        input_volume: volume,
        calculated_loss: rawRecoverable,
        crop_type: crop,
      });
      trackROICalculatorInteraction(volume, rawRecoverable, crop);
    }, 2000);
    return () => clearTimeout(timer);
  }, [volume, credit, crop, rawRecoverable]);

  const estimatedLoss = useSmoothNumber(rawEstimatedLoss);
  const recoverable = useSmoothNumber(rawRecoverable);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val);

  const volumePercent = ((volume - 100) / (10000 - 100)) * 100;
  const creditPercent = ((credit - 1000) / (50000 - 1000)) * 100;

  return (
    <section id="roi" className="bg-surface-light dark:bg-surface-dark py-20 border-y border-gray-200 dark:border-white/5 relative">
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 24px; height: 24px; border-radius: 50%;
          background: #61b869; cursor: pointer; border: 3px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: transform 0.15s cubic-bezier(0.4, 0.0, 0.2, 1), box-shadow 0.15s ease;
          transform: translateY(-50%);
        }
        .slider-thumb::-webkit-slider-thumb:hover { transform: translateY(-50%) scale(1.2); box-shadow: 0 4px 12px rgba(97,184,105,0.4); }
        .slider-thumb:active::-webkit-slider-thumb { transform: translateY(-50%) scale(1.1); background: #4a9e52; cursor: grabbing; }
        .slider-thumb::-moz-range-thumb {
          width: 24px; height: 24px; border-radius: 50%;
          background: #61b869; cursor: pointer; border: 3px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: transform 0.15s cubic-bezier(0.4, 0.0, 0.2, 1), box-shadow 0.15s ease;
        }
        .slider-thumb::-moz-range-thumb:hover { transform: scale(1.2); box-shadow: 0 4px 12px rgba(97,184,105,0.4); }
        .slider-thumb:active::-moz-range-thumb { transform: scale(1.1); background: #4a9e52; cursor: grabbing; }
        .slider-thumb::-webkit-slider-runnable-track { height: 6px; }
        .slider-thumb::-moz-range-track { height: 6px; }
      `}</style>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Estimate What Leakage Is Costing You</h2>
          <p className="text-gray-600 dark:text-gray-400">Directional numbers based on average cooperative inputs. Your real figures will be sharper after a 30-minute audit of your supply chain.</p>
        </div>

        <div className="bg-white dark:bg-[#151d16] rounded-lg shadow-xl border border-gray-200 dark:border-white/10 p-6 transform transition-all hover:shadow-2xl duration-500">
          <div className="grid gap-12 md:grid-cols-2 mb-8">
            {/* Inputs */}
            <div className="space-y-10">
              <div className="group">
                <div className="flex justify-between mb-4">
                  <label htmlFor="roi-volume" className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">Annual Procurement Volume</label>
                  <span className="text-sm font-bold text-primary font-mono bg-primary/5 px-2 py-0.5 rounded">{volume.toLocaleString()} MT</span>
                </div>
                <div className="relative flex items-center h-4">
                  <div className="absolute w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 transition-all duration-75 ease-out" style={{ width: `${volumePercent}%` }}></div>
                  </div>
                  <input
                    id="roi-volume"
                    name="volume"
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="slider-thumb w-full absolute bg-transparent appearance-none h-full focus:outline-none z-10"
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between mb-4">
                  <label htmlFor="roi-credit" className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">Avg Input Credit per Farmer</label>
                  <span className="text-sm font-bold text-primary font-mono bg-primary/5 px-2 py-0.5 rounded">KES {credit.toLocaleString()}</span>
                </div>
                <div className="relative flex items-center h-4">
                  <div className="absolute w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 transition-all duration-75 ease-out" style={{ width: `${creditPercent}%` }}></div>
                  </div>
                  <input
                    id="roi-credit"
                    name="credit"
                    type="range"
                    min="1000"
                    max="50000"
                    step="1000"
                    value={credit}
                    onChange={(e) => setCredit(Number(e.target.value))}
                    className="slider-thumb w-full absolute bg-transparent appearance-none h-full focus:outline-none z-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Crop Type</label>
                <div className="flex rounded-lg shadow-sm bg-gray-50 dark:bg-white/5 p-1 border border-gray-200 dark:border-white/10" role="group">
                  {(['Tea', 'Coffee', 'Avocado'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCrop(c)}
                      className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 relative overflow-hidden
                        ${crop === c
                          ? 'bg-primary text-white shadow-sm scale-[1.02]'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/5'
                        }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex justify-end items-center gap-2">
                  <span className="text-xs text-gray-400">Leakage risk factor:</span>
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{cropFactors[crop]}x</span>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="flex flex-col justify-between p-6 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 relative overflow-hidden group/card">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover/card:bg-primary/10 transition-colors duration-500"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover/card:bg-red-500/10 transition-colors duration-500"></div>

              <div className="text-center relative z-10 space-y-1">
                <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold">Est. Annual Leakage (without traceability)</p>
                <div className="text-4xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">
                  <span className="text-red-600">{formatCurrency(estimatedLoss)}</span>
                </div>
                <p className="text-xs text-red-600 italic">Input loss + payment delays + compliance gaps</p>
              </div>

              <div className="my-6 flex items-center justify-center">
                <div className="h-px bg-gray-200 dark:bg-white/10 w-full"></div>
                <div className="mx-3 text-gray-400 text-[10px] font-bold tracking-widest">Recoverable with Vunachain</div>
                <div className="h-px bg-gray-200 dark:bg-white/10 w-full"></div>
              </div>

              <div className="text-center relative z-10 space-y-1">
                <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold">Recoverable Value</p>
                <div className="text-4xl font-black tracking-tight tabular-nums text-primary scale-110 origin-center transition-transform">
                  {formatCurrency(recoverable)}
                </div>
                <p className="text-xs text-green-700 dark:text-green-500 italic">Escrow + instant payout + audit-ready records</p>
              </div>

              <a
                href="#demo"
                className="w-full mt-8 py-4 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm uppercase tracking-wide hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group/btn"
              >
                <span>Book a 30-min Audit</span>
                <span className="material-symbols-outlined text-lg group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimers */}
        <p className="mt-6 text-center text-xs text-gray-400 max-w-2xl mx-auto">
          Estimates are directional and based on typical leakage rates for smallholder supply chains in East Africa.
          Your actual figures depend on procurement volume, crop, input financing structure, and current traceability maturity.
          We&rsquo;ll calibrate these numbers together during the audit.
        </p>
      </div>
    </section>
  );
};

export default ROICalculator;
