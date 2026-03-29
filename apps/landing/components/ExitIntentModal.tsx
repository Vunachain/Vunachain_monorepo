import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { trackChecklistDownload, trackFormFrictionStart } from '../utils/analytics';

const ExitIntentModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const [canTrigger, setCanTrigger] = useState(false);

  useEffect(() => {
    // Prevent immediate exit intent popups (wait 5s)
    const timer = setTimeout(() => setCanTrigger(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger if mouse moves faster than 10px from top and we haven't shown yet
      if (e.clientY <= 5 && !hasShown && canTrigger) {
        setIsVisible(true);
        setHasShown(true);
      }
    };

    const handleWindowFocus = () => {
      // Potential secondary trigger logic if focus is lost then regained
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown, canTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // Subscribe user to lead list
    const response = await api.leads.subscribe({
      email,
      source: 'checklist_nudge'
    });

    if (response.success) {
      setStatus('success');
      trackChecklistDownload(email);
      setEmail('');

      // Auto close after 3 seconds
      setTimeout(() => setIsVisible(false), 3000);
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1a231b] rounded-lg shadow-2xl max-w-lg w-full p-6 relative overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <span className="material-symbols-outlined text-3xl">library_books</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Not ready to overhaul your system?
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            At least protect yourself from the regulators. Download our free <strong>"2026 EUDR Compliance Checklist for Kenyan Exporters."</strong>
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="Enter your email to receive the PDF"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => trackFormFrictionStart('exit_intent_email')}
              disabled={status === 'loading' || status === 'success'}
              className="w-full h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black/20 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />

            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className={`w-full h-12 rounded-lg font-bold text-lg shadow-sm transition-all duration-300 flex items-center justify-center gap-2 ${status === 'success'
                ? 'bg-green-600 text-white shadow-green-600/20'
                : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5'
                }`}
            >
              {status === 'loading' ? (
                <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : status === 'success' ? (
                <>
                  <span className="material-symbols-outlined">check</span>
                  Check your inbox!
                </>
              ) : (
                'Send Me the Checklist'
              )}
            </button>
          </form>

          {status === 'error' && (
            <p className="mt-2 text-sm text-red-500 animate-pulse">
              Something went wrong. Please try again.
            </p>
          )}

          <button
            onClick={() => setIsVisible(false)}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            No thanks, I'll risk it.
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitIntentModal;