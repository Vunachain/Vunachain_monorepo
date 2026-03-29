import React, { useState } from 'react';
import Tooltip from './Tooltip';
import { api } from '../utils/api';
import { trackFormFrictionStart, trackPilotRequestSuccess } from '../utils/analytics';
import LegalModal from './LegalModal';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const response = await api.leads.subscribe({ email, source: 'footer' });

    if (response.success) {
      setStatus('success');

      // Track analytics conversion
      trackPilotRequestSuccess('N/A', 'pilot_audit');

      setEmail('');
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* CTA Section */}
      <section id="demo" className="bg-[#101611] px-4 py-20 text-center text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl opacity-20 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/30 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="mx-auto max-w-4xl relative z-10">
          <h2 className="mb-6 text-4xl font-black tracking-tight sm:text-5xl">
            Secure Your Next Harvest.
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
            The 2026 planting season is approaching. Don't risk another cycle of leakage and regulatory uncertainty. Onboard your first 100 farmers in under 48 hours.
          </p>

          <div className="mx-auto max-w-lg">
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubmit}>
              <label htmlFor="footer-email" className="sr-only">Work Email</label>
              <input
                id="footer-email"
                name="email"
                type="email"
                placeholder="Enter your work email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => trackFormFrictionStart('footer_email')}
                disabled={status === 'success' || status === 'loading'}
                className="flex-grow h-14 px-6 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === 'success' || status === 'loading'}
                className={`h-14 px-8 rounded-lg font-bold text-lg shadow-sm transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed ${status === 'success'
                  ? 'bg-green-600 text-white shadow-green-600/20'
                  : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 active:scale-95'
                  }`}
              >
                {status === 'loading' ? (
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                ) : status === 'success' ? (
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">check</span> Sent</span>
                ) : (
                  'Start My Audit Pilot'
                )}
              </button>
            </form>
            {status === 'error' && (
              <p className="mt-2 text-sm text-red-500 animate-pulse">
                Something went wrong. Please try again.
              </p>
            )}
            <p className="mt-4 text-sm text-gray-500">
              Join 12+ Kenyan cooperatives securing their 2026 harvest.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Links Section */}
      <section className="px-4 py-20 border-t border-white/10">
        <div className="mx-auto max-w-7xl text-center text-sm text-gray-500 relative z-10">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            <p>&copy; 2026 Vunachain. Nairobi, Kenya.</p>
            <nav className="flex gap-6" aria-label="Footer links">
              <button
                onClick={() => setActiveLegalModal('privacy')}
                className="hover:text-white hover:underline hover:decoration-primary hover:underline-offset-4 transition-all duration-200"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setActiveLegalModal('terms')}
                className="hover:text-white hover:underline hover:decoration-primary hover:underline-offset-4 transition-all duration-200"
              >
                Terms of Service
              </button>
              <a
                href="https://www.linkedin.com/company/vunachain"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:underline hover:decoration-primary hover:underline-offset-4 transition-all duration-200"
              >
                LinkedIn
              </a>
            </nav>
          </div>
        </div>
      </section>

      {/* Legal Modals */}
      <LegalModal
        isOpen={activeLegalModal === 'privacy'}
        onClose={() => setActiveLegalModal(null)}
        title="Privacy Policy"
        type="privacy"
      />
      <LegalModal
        isOpen={activeLegalModal === 'terms'}
        onClose={() => setActiveLegalModal(null)}
        title="Terms of Service"
        type="terms"
      />
    </footer>
  );
};

export default Footer;