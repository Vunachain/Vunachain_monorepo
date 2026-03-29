import React, { useEffect, useState } from 'react';
import Tooltip from './Tooltip';
import { getLandingPageData } from '../lib/sanity';

const ProblemSection: React.FC = () => {
  const [content, setContent] = useState<any>(null);

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

  const defaultPainPoints = [
    { title: "25% Input Loss", description: "You finance the seeds; brokers take the harvest. Without programmable escrow, your input credit is an unsecured loan that often never comes back.", icon: "water_drop" },
    { title: "Global Market Access", description: "2026 EUDR Regulations demand geospatial proof for every kilo. One unverified plot can get your entire container rejected at Rotterdam.", icon: "public" },
    { title: "Regulatory Friction", description: "Manual data management for the Tea Act 2020 or Crops Act is an operational nightmare. Digitize reporting or face non-compliance fines.", icon: "assignment" }
  ];

  const painPoints = content?.painPoints || defaultPainPoints;

  return (
    <section id="challenges" className="bg-surface-light dark:bg-surface-dark py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">

        <header className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-4">
            {content?.title || 'The "Hidden Tax" on Your Operations.'}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            {content?.description || 'Every season you rely on manual systems, you pay a heavy price. Do you know your exact numbers?'}
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-3">
          {painPoints.map((point: any, idx: number) => (
            <article key={idx} className="group relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:border-red-200 hover:shadow-xl dark:border-white/10 dark:bg-[#1a231b] dark:hover:border-red-900/50">
              <Tooltip content={point.title}>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-3xl" aria-hidden="true">{point.icon}</span>
                </div>
              </Tooltip>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{point.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {point.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;