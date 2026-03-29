import React from 'react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type: 'privacy' | 'terms';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, type }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#1a231b] rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col relative animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto text-gray-600 dark:text-gray-300 space-y-4">
                    {type === 'privacy' ? (
                        <>
                            <p className="font-semibold text-gray-900 dark:text-white">Last Updated: February 2026</p>
                            <p>Vunachain is committed to protecting the privacy and security of your data. This Privacy Policy outlines how we collect, use, and safeguard information in compliance with the Kenyan Data Protection Act (2019) and the Office of the Data Protection Commissioner (ODPC).</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4">1. Information Collection</h3>
                            <p>We collect information you provide directly to us through demo requests, newsletter sign-ups, and ROI calculator interactions. This may include your name, email address, company name, and supply chain data.</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4">2. Use of Data</h3>
                            <p>Your data is used to provide EUDR compliance services, improve our platform analytics, and communicate with you about your account. We do not sell your personal data to third parties.</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4">3. Data Residency</h3>
                            <p>In adherence to Kenyan law, certain categories of sensitive data are stored within the territory of Kenya unless specific conditions for cross-border transfer are met.</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4">4. Your Rights</h3>
                            <p>Under the Data Protection Act, you have the right to access, rectify, or erase your personal data held by Vunachain. Contact us at privacy@vunachain.com to exercise these rights.</p>
                        </>
                    ) : (
                        <>
                            <p className="font-semibold text-gray-900 dark:text-white">Last Updated: February 2026</p>
                            <p>By using the Vunachain platform, you agree to the following terms and conditions. These terms govern your access to and use of Vunachain's compliance and traceability services.</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4">1. Service Description</h3>
                            <p>Vunachain provides a digital platform for monitoring EUDR compliance and reducing side-selling in agricultural supply chains. Verification is provided based on the data submitted by users and farmers.</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4">2. User Responsibilities</h3>
                            <p>Users are responsible for ensuring the accuracy of all data uploaded to the platform. Misrepresentation of farm locations or harvest volumes may result in suspension of service.</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4">3. Compliance Disclaimer</h3>
                            <p>While Vunachain facilitates compliance with European Union Deforestation Regulation (EUDR), the final legal responsibility for compliance rests with the importer of record into the EU.</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4">4. Intellectual Property</h3>
                            <p>All software, branding, and custom analytics algorithms remain the exclusive property of VunaStack and Vunachain.</p>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-white/10 text-center">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
