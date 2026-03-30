import React, { useState } from 'react';
import { api } from '../utils/api';
import { trackFormFrictionStart, trackPilotRequestSuccess } from '../utils/analytics';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    interest: 'compliance'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let locationPoint = undefined;

    // Attempt to get user location for EUDR traceability demonstration
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 60000
          });
        });
        locationPoint = `POINT(${position.coords.longitude} ${position.coords.latitude})`;
      } catch {
        console.warn("Geolocation denied or timed out. Proceeding without location.");
      }
    }

    const payload = {
      ...formData,
      location_point: locationPoint
    };

    const response = await api.leads.createDemoRequest(payload);

    setIsSubmitting(false);

    if (response.success) {
      setIsSuccess(true);

      // Track analytics conversion
      trackPilotRequestSuccess(formData.company, formData.interest);

      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({ name: '', email: '', company: '', interest: 'compliance' });
      }, 3000);
    } else {
      // Basic error handling for now - could be improved with a toast
      alert(response.error || 'Failed to submit request. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1a231b] rounded-lg shadow-2xl max-w-lg w-full p-6 relative overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Request Received!</h2>
            <p className="text-gray-600 dark:text-gray-300">
              One of our compliance experts will reach out to you within 24 hours to schedule your demo.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Secure Your Demo.</h2>
              <p className="text-gray-600 dark:text-gray-300">
                See how Vunachain can automate your EUDR compliance and stop side-selling.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="modal-full-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  id="modal-full-name"
                  name="name"
                  type="text"
                  required
                  className="w-full h-12 px-4 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Work Email</label>
                  <input
                    id="modal-email"
                    name="email"
                    type="email"
                    required
                    className="w-full h-12 px-4 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="modal-company" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                  <input
                    id="modal-company"
                    name="company"
                    type="text"
                    required
                    className="w-full h-12 px-4 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Export Ltd"
                    value={formData.company}
                    onFocus={() => trackFormFrictionStart('company')}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-interest" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Primary Interest</label>
                <select
                  id="modal-interest"
                  name="interest"
                  className="w-full h-12 px-4 rounded-lg border border-gray-200 dark:border-white/10 bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                >
                  <option value="compliance">EUDR, Tea Act 2020 & Rainforest Alliance</option>
                  <option value="sideselling">Stopping Side-Selling</option>
                  <option value="finance">Input Finance Recovery</option>
                  <option value="partner">Partner with us</option>
                  <option value="other">General Demo</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-primary text-white font-bold text-lg rounded-lg shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    Request Demo for {formData.company || 'My Company'}
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-gray-500">
              By clicking, you agree to our terms and to be contacted by our team.
            </p>
          </div>
        )}
      </div>
    </div >
  );
};

export default DemoModal;
