import React from 'react';
import Tooltip from './Tooltip';

const Benefits: React.FC = () => {
  return (
    <section id="trust" className="py-20 bg-white dark:bg-background-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Market Access, Guaranteed.
          </h2>
          <p className="mx-auto max-w-xl text-gray-600 dark:text-gray-400">
            Compliance that unlocks buyers, not just avoids fines.
          </p>
        </div>

        {/* Testimonial */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="relative z-10">
            <span className="material-symbols-outlined text-6xl text-gray-200 dark:text-gray-700 absolute -top-8 -left-4 -z-10">format_quote</span>
            <p className="text-2xl font-medium text-gray-800 dark:text-gray-200 italic leading-relaxed">
              &quot;Before Vunachain, a single missing weighbridge receipt could invalidate our entire season&rsquo;s traceability. Now every kilo has a verifiable on-chain record from farm to port. Our European buyers cite our transparency as the reason they renewed the contract.&quot;
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-300 bg-[url('https://images.unsplash.com/photo-1567532939604-b6c5b0adcc80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80')] bg-cover"></div>
              <div className="text-left">
                <p className="font-bold text-gray-900 dark:text-white">Wanjiku Kamau</p>
                <p className="text-sm text-gray-500">Head of Compliance, Mwangi Tea Exports &mdash; Nairobi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-80">
          <div className="flex flex-col items-center gap-2 group cursor-default transition-transform duration-300 hover:-translate-y-2">
            <Tooltip content="Information Security">
              <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-gray-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                <span className="material-symbols-outlined text-3xl">verified_user</span>
              </div>
            </Tooltip>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors duration-300">
              ISO 27001 Security
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 group cursor-default transition-transform duration-300 hover:-translate-y-2">
            <Tooltip content="Kenya Tea Act 2020 Compliance">
              <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-gray-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                <span className="material-symbols-outlined text-3xl">gavel</span>
              </div>
            </Tooltip>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors duration-300">
              Tea Act 2020 Ready
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 group cursor-default transition-transform duration-300 hover:-translate-y-2">
            <Tooltip content="Data Privacy">
              <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-gray-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                <span className="material-symbols-outlined text-3xl">policy</span>
              </div>
            </Tooltip>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors duration-300">
              GDPR &amp; Kenya DPA
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 group cursor-default transition-transform duration-300 hover:-translate-y-2">
            <Tooltip content="Sustainable Infrastructure">
              <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-gray-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                <span className="material-symbols-outlined text-3xl">forest</span>
              </div>
            </Tooltip>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors duration-300">
              Carbon-Neutral Infra
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
