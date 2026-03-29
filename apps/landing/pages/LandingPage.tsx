import React from 'react';
import Hero from '../components/Hero';
import TrustBar from '../components/TrustBar';
import ProblemSection from '../components/ProblemSection';
import FeatureSpotlight from '../components/FeatureSpotlight';
import HowItWorks from '../components/HowItWorks';
import ROICalculator from '../components/ROICalculator';
import Benefits from '../components/Benefits';
import SEO from '../components/SEO';
import { generateOrganizationSchema } from '../lib/schema';

interface LandingPageProps {
    onOpenDemo: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onOpenDemo }) => {
    return (
        <>
            <SEO schema={generateOrganizationSchema()} />
            <Hero />
            <TrustBar />
            <ProblemSection />
            <FeatureSpotlight />
            <HowItWorks />
            <ROICalculator onOpenDemo={onOpenDemo} />
            <Benefits />
        </>
    );
};

export default LandingPage;
