import React, { useEffect, useState } from 'react';
import Tooltip from './Tooltip';
import { getLandingPageData } from '../lib/sanity';

interface ProblemContent {
  title?: string;
  description?: string;
  painPoints?: PainPoint[];
}

interface PainPoint {
  title: string;
  description: string;
  icon: string;
}

const ProblemSection: React.FC = () => {
  const [content, setContent] = useState<ProblemContent | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getLandingPageData();
        if (data && data.problem) setContent(data.problem);
      } catch (error) {
        console.error('Error fetching problem content:', error);
      }
    };
    fetchContent();
  }, []);

  // Separated by audience so each visitor finds their lane
  const cooperativePainPoints = [
    {
      title: 'Side-selling & Input Leakage',
      description: 'You finance the seeds and fertiliser; brokers take the harvest. Without programmable escrow, your input credit becomes an unsecured loan that often never comes back. Up to 25% of your financed inputs leak out the side door every season.',
      icon: 'water_drop',
    },
    {
      title: 'Delayed Farmer Payments',
      description: 'Farmers wait weeks for payment after delivery. When cash flow stalls, they side-sell to the next broker who pays same-day. M-Pesa exists — your settlement process should too.',
      icon: 'schedule',
    },
    {
      title: 'Paper Trails That Fall Apart',
      description: 'Manual records for the Tea Act 2020, Crops Act, and buyer audits don\'t survive a busy harvest season. One missing weighbridge receipt can invalidate your entire season\'s traceability.',
      icon: 'assignment',
    },
  ];

  const exporterPainPoints = [
    {
      title: 'EUDR Rejection at Port',
      description: '2026 EU regulations demand geospatial proof for every kilo entering the market. One unverified plot in your supply chain can get your entire container held at Rotterdam — with demurrage stacking daily.',
      icon: 'public',
    },
    {
      title: 'No Provable Origin Story',
      description: 'Buyers increasingly demand more than a certificate. They want to see the farm, the harvest date, the input history — verifiable, not just attested. Without that, you lose the premium buyers first.',
      icon: 'track_changes',
    },
    {
      title: 'Compliance That Scales Poorly',
      description: 'Manual data collection across hundreds of smallholders doesn\'t scale. Each additional cooperative, each new region, each seasonal worker adds more spreadsheets — and more places for the record to break.',
      icon: 'inventory_2',
    },
  ];

  return (
    <section id="challenges" className="bg-surface-light dark:bg-surface-dark py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <header className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-4">
            {content?.title || 'The Hidden Cost of Unverifiable Supply Chains.'}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            {content?.description ||
              'Whether you\'re sourcing from smallholders or shipping to Europe, the same gap costs you: proof you can\'t produce when it\'s asked for.'}
          </p>
        </header>

        {/* Cooperative lane */}
        <div className="mb-12">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">For Cooperatives &amp; Aggregators</span>
          <div className="grid gap-6 md:grid-cols-3 mt-6">
            {cooperativePainPoints.map((point: PainPoint, idx: number) => (
              <article
                key={idx}
                className="group relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:border-red-200 hover:shadow-xl dark:border-white/10 dark:bg-[#1a231b] dark:hover:border-red-900/50"
              >
                <Tooltip content={point.title}>
                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-3xl" aria-hidden="true">{point.icon}</span>
                  </div>
                </Tooltip>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{point.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{point.description}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Divider + exporter lane */}
        <div>
          <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">For Exporters &amp; Buyers</span>
          <div className="grid gap-6 md:grid-cols-3 mt-6">
            {exporterPainPoints.map((point: PainPoint, idx: number) => (
              <article
                key={idx}
                className="group relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:border-red-200 hover:shadow-xl dark:border-white/10 dark:bg-[#1a231b] dark:hover:border-red-900/50"
              >
                <Tooltip content={point.title}>
                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-3xl" aria-hidden="true">{point.icon}</span>
                  </div>
                </Tooltip>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{point.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{point.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
