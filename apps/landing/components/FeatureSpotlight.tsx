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

      // Check if section is in viewport
      if (rect.top < viewportHeight && rect.bottom > 0) {
        // Calculate offset based on center of viewport relative to element
        // moving slowly (factor 0.1)
        const relativePos = rect.top - viewportHeight / 2;
        setOffset(relativePos * 0.1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial calculation
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={sectionRef} id="technology" className="bg-white dark:bg-background-dark py-20 overflow-hidden relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Turn &quot;Hope&quot; into &quot;Enforcement.&quot;
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            We replace fallible human promises with infallible code and sensors.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-2">

          {/* Feature Strip 1: AlphaEarth */}
          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-surface-light dark:border-white/10 dark:bg-[#1a231b] shadow-sm group hover:shadow-2xl transition-all duration-500">
            <div className="p-6 relative z-10">
              <Tooltip content="Satellite Monitoring">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <span className="material-symbols-outlined">satellite_alt</span>
                </div>
              </Tooltip>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">We see what brokers hope you miss.</h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                Our 10m-resolution satellite embeddings create a &quot;Digital Twin&quot; of every contracted plot. We verify planting, monitor crop health, and prove non-deforestation status from orbit. No ground visit required.
              </p>
            </div>

            <div className="relative h-64 w-full bg-gray-900 overflow-hidden">
              {/* Parallax Container */}
              <div
                className="absolute inset-[-10%] w-[120%] h-[120%]"
                style={{ transform: `translateY(${offset}px)` }}
              >
                {/* Hover Scale Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-80 transition-transform duration-700 ease-out group-hover:scale-105"
                  title="Satellite heatmap showing vegetation index"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBpt6nfXZII9_7HZojmqiO7ylFERLE0VjgtsTb07Px4zyK9rOg4hcUAv5Pi7lO02MJMfLXGpUvwq9S7K1LXmTVXLSuLrYHtDQ3s8yGK_FS92JnO4aGByTZ1D-yqdNUZGDFGpiIXzDVEPUbFJz0RKOGZy8cAl6bBhf21Q0HmiSLVuXv0G8VR6t-hsIQ7mKAXDP6VrZylaH4viRGsGwcWcER7YGzD_EqxKSHjXunb_8KiLzpn8IowgLRmx5R6hA1VWQZ4hC9TUUtLfZAy')" }}
                ></div>
              </div>

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent to-black/60 pointer-events-none"></div>

              {/* Overlay UI */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded bg-black/60 p-3 backdrop-blur text-xs text-white z-20">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span>Live Feed</span>
                </div>
                <span className="font-mono text-green-400">Risk: 0%</span>
              </div>
            </div>
          </div>

          {/* Feature Strip 2: Smart Contracts */}
          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-surface-light dark:border-white/10 dark:bg-[#1a231b] shadow-sm group hover:shadow-2xl transition-all duration-500">
            <div className="p-6 relative z-10">
              <Tooltip content="Smart Contract Escrow">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                  <span className="material-symbols-outlined">lock_clock</span>
                </div>
              </Tooltip>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Security, Guaranteed by Code.</h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                Vunachain&apos;s smart contracts automate trust between cooperatives and farmers. By settling input credits directly at the point of delivery, we ensure transparent, instant payouts and reliable debt recovery without manual friction.
              </p>
            </div>

            <div className="relative h-64 w-full bg-gray-50 dark:bg-white/5 p-6 flex items-center justify-center overflow-hidden">
              {/* Background Pattern with Parallax */}
              <div
                className="absolute inset-[-10%] w-[120%] h-[120%] opacity-5 dark:opacity-10 bg-[radial-gradient(#61b869_1px,transparent_1px)] [background-size:16px_16px]"
                style={{
                  transform: `translateY(${offset * 0.5}px)`, // Move slower than the satellite image for depth variety
                }}
              ></div>

              {/* Flowchart Visualization */}
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
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Loan Repaid</span>
                </div>

                <div className="flex-1 h-0.5 bg-gray-300 dark:bg-white/10 mx-2 relative"></div>

                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-blue-500 text-sm">payments</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Payout</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FeatureSpotlight;