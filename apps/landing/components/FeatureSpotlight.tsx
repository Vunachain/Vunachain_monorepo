import React, { useEffect, useRef, useState } from 'react';
import Tooltip from './Tooltip';

const FeatureSpotlight: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      if (rect.top < viewportHeight && rect.bottom > 0) {
        const relativePos = rect.top - viewportHeight / 2;
        setOffset(relativePos * 0.1);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={sectionRef} id="technology" className="bg-white dark:bg-background-dark py-20 overflow-hidden relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Four Capabilities. One Audit-Ready Record.
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Satellite verification, blockchain traceability, smart contract escrow, and automated M-Pesa settlements — each feeds the same on-chain record your inspectors and buyers can verify.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Satellite */}
          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-surface-light dark:border-white/10 dark:bg-[#1a231b] shadow-sm group hover:shadow-2xl transition-all duration-500">
            <div className="p-6 relative z-10">
              <Tooltip content="Satellite Monitoring">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <span className="material-symbols-outlined">satellite_alt</span>
                </div>
              </Tooltip>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">We see what brokers hope you miss.</h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                10m-resolution satellite embeddings create a digital twin of every contracted plot. We verify planting, monitor crop health, and prove non-deforestation status from orbit. No ground visit required for baseline attestation.
              </p>
            </div>
            <div className="relative h-64 w-full bg-gray-900 overflow-hidden">
              <div
                className="absolute inset-[-10%] w-[120%] h-[120%]"
                style={{ transform: `translateY(${offset}px)` }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-80 transition-transform duration-700 ease-out group-hover:scale-105"
                  title="Satellite heatmap showing vegetation index"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBpt6nfXZII9_7HZojmqiO7ylFERLE0VjgtsTb07Px4zyK9rOg4hcUAv5Pi7lO02MJMfLXGpUvwq9S7K1LXmTVXLSuLrYHtDQ3s8yGK_FS92JnO4aGByTZ1D-yqdNUZGDFGpiIXzDVEPUbFJz0RKOGZy8cAl6bBhf21Q0HmiSLVuXv0G8VR6t-hsIQ7mKAXDP6VrZylaH4viRGsGwcWcER7YGzD_EqxKSHjXunb_8KiLzpn8IowgLRmx5R6hA1VWQZ4hC9TUUtLfZAy')" }}
                ></div>
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent to-black/60 pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded bg-black/60 p-3 backdrop-blur text-xs text-white z-20">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span>Live Feed</span>
                </div>
                <span className="font-mono text-green-400">Risk: 0%</span>
              </div>
            </div>
          </div>

          {/* Smart Contracts + Escrow */}
          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-surface-light dark:border-white/10 dark:bg-[#1a231b] shadow-sm group hover:shadow-2xl transition-all duration-500">
            <div className="p-6 relative z-10">
              <Tooltip content="Smart Contract Escrow">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                  <span className="material-symbols-outlined">lock_clock</span>
                </div>
              </Tooltip>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Security, Guaranteed by Code.</h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                Vunachain&rsquo;s smart contracts automate trust between cooperatives and farmers. Input credits are held in escrow and released only when harvest is verified on-chain. Farmers get paid instantly via M-Pesa; cooperatives get their credit back or recovered — no manual reconciliation.
              </p>
            </div>
            <div className="relative h-64 w-full bg-gray-50 dark:bg-white/5 p-6 flex items-center justify-center overflow-hidden">
              <div
                className="absolute inset-[-10%] w-[120%] h-[120%] opacity-5 dark:opacity-10 bg-[radial-gradient(#61b869_1px,transparent_1px)] [background-size:16px_16px]"
                style={{ transform: `translateY(${offset * 0.5}px)` }}
              ></div>
              <div className="w-full max-w-sm flex items-center justify-between text-center relative z-10 transition-transform duration-500 group-hover:scale-105">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Verified</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-300 dark:bg-white/10 mx-2 relative">
                  <div className="absolute inset-0 bg-primary origin-left animate-[grow_2s_ease-in-out_infinite]"></div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-red-500 text-sm">money_off</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Escrow Held</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-300 dark:bg-white/10 mx-2 relative"></div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-blue-500 text-sm">payments</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 uppercase">M-Pesa Payout</span>
                </div>
              </div>
            </div>
          </div>

          {/* M-Pesa / Payouts — third card */}
          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-surface-light dark:border-white/10 dark:bg-[#1a231b] shadow-sm group hover:shadow-2xl transition-all duration-500">
            <div className="p-6 relative z-10">
              <Tooltip content="M-Pesa Automatic Settlements">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <span className="material-symbols-outlined">payments</span>
                </div>
              </Tooltip>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Farmers Paid Same-Day, On-Chain.</h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                When a harvest batch is verified, the smart contract releases input credit settlement directly to the farmer&rsquo;s M-Pesa wallet. No manual payment runs, no delayed cheques, no side-selling incentive. The ledger records every disbursement immutably.
              </p>
            </div>
            <div className="relative h-48 w-full bg-gradient-to-r from-green-900/20 to-transparent flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-5xl text-green-500 mb-2">mobility</span>
                <p className="text-sm font-mono text-green-700 dark:text-green-400">M-Pesa &middot; cUSD &middot; Settlement</p>
              </div>
            </div>
          </div>

          {/* Compliance Reports — fourth card */}
          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-surface-light dark:border-white/10 dark:bg-[#1a231b] shadow-sm group hover:shadow-2xl transition-all duration-500">
            <div className="p-6 relative z-10">
              <Tooltip content="Automated Compliance Reporting">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                  <span className="material-symbols-outlined">description</span>
                </div>
              </Tooltip>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance Reports, One Click Away.</h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                Export-ready EUDR declarations, Tea Act 2020 reports, and buyer-specific traceability records generated automatically from the on-chain data. No reconstructing the season from spreadsheets. The report is the record.
              </p>
            </div>
            <div className="relative h-48 w-full bg-gray-50 dark:bg-white/5 p-6 flex items-center justify-center overflow-hidden">
              <div className="text-center w-full max-w-xs">
                <div className="h-px bg-gray-300 dark:bg-white/10 mb-3"></div>
                <div className="bg-white dark:bg-[#1a231b] rounded p-3 shadow-sm border border-gray-200 dark:border-white/10 text-left mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">EUDR Declaration</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                    Batch KE-2024-899 &middot; 12.4 MT Arabica &middot; Deforestation Risk: 0%
                  </div>
                </div>
                <div className="h-px bg-gray-300 dark:bg-white/10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSpotlight;
