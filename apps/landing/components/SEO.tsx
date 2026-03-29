import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SchemaScript } from '../lib/schema';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    article?: boolean;
    keywords?: string;
    schema?: string;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    image,
    article,
    keywords,
    schema
}) => {
    const { pathname } = useLocation();
    const siteName = 'Vunachain';
    const siteUrl = 'https://vunachain.com';

    const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - EUDR Compliance & Supply Chain Traceability`;
    const defaultDescription = description || 'Source verified produce through Vunachain’s transparent contract farming platform. Ensuring EUDR compliance, fair pricing, and immutable on-chain history for Kenyan agriculture.';
    const defaultKeywords = keywords || 'Contract Farming Kenya, EUDR Compliance, Celo Blockchain, Agri-tech, Smart Contracts, Vunachain';
    const fullUrl = `${siteUrl}${pathname}`;
    const defaultImage = `${siteUrl}/og-image.png`;
    const ogImage = image || defaultImage;

    return (
        <>
            <Helmet>
                {/* Primary Meta Tags */}
                <title>{fullTitle}</title>
                <meta name="title" content={fullTitle} />
                <meta name="description" content={defaultDescription} />
                <meta name="keywords" content={defaultKeywords} />
                <link rel="canonical" href={fullUrl} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content={article ? 'article' : 'website'} />
                <meta property="og:url" content={fullUrl} />
                <meta property="og:title" content={fullTitle} />
                <meta property="og:description" content={defaultDescription} />
                <meta property="og:image" content={ogImage} />

                {/* Twitter */}
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content={fullUrl} />
                <meta property="twitter:title" content={fullTitle} />
                <meta property="twitter:description" content={defaultDescription} />
                <meta property="twitter:image" content={ogImage} />
            </Helmet>
            {schema && <SchemaScript schema={schema} />}
        </>
    );
};

export default SEO;
