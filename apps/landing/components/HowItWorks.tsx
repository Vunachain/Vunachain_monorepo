import React from 'react';
import Tooltip from './Tooltip';

const steps = [
  {
    icon: 'satellite_alt',
    title: '1. Map the Source',
    desc: 'We geotag farms with satellite precision, creating a digital twin of every acre.',
    tooltip: 'Satellite Mapping'
  },
  {
    icon: 'timeline',
    title: '2. Trace the Journey',
    desc: 'Every movement of produce is recorded immutably on the Celo blockchain, ensuring zero data tampering.',
    tooltip: 'Immutable Ledger'
  },
  {
    icon: 'verified_user',
    title: '3. Verify Compliance',
    desc: 'Generate instant, audit-ready reports that certify your shipment meets all EUDR requirements.',
    tooltip: 'Instant Verification'
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section id="process" className="py-20 lg:py-28 bg-background-light dark:bg-surface-dark border-y border-gray-200 dark:border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            How Vunachain Works
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Three automated steps to total compliance.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connecting Line (Desktop) */}
          <div className="absolute left-0 top-12 hidden h-0.5 w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block pointer-events-none"></div>

          {steps.map((step, index) => (
            <div key={index} className="group relative flex flex-col items-center text-center">
              <Tooltip content={step.tooltip}>
                <div className="relative">
                  {/* Glow effect background */}
                  <div className="absolute -inset-2 rounded-lg bg-primary/20 blur-xl opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"></div>

                  {/* Card Container */}
                  <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-xl transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-primary/20 dark:border-white/10 dark:bg-background-dark dark:shadow-none dark:group-hover:shadow-primary/20 dark:group-hover:border-primary/50">
                    <span className="material-symbols-outlined text-4xl text-primary transition-transform duration-300 group-hover:scale-110">{step.icon}</span>
                  </div>
                </div>
              </Tooltip>
              <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-primary">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;