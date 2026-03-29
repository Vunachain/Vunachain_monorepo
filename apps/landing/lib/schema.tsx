import React from 'react';

// Vunachain_landing/lib/schema.ts
// JSON-LD Schema Generator (schema.org)
// Creates machine-readable markup for search engines and LLMs

interface ArticleSchemaData {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  authorEmail?: string;
  url: string;
  category?: string;
  keywords?: string[];
}

export function generateArticleSchema(data: ArticleSchemaData): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.title,
    description: data.description,
    image: [data.image],
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      '@type': 'Person',
      name: data.author,
      ...(data.authorEmail && { email: data.authorEmail }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Vunachain',
      logo: {
        '@type': 'ImageObject',
        url: 'https://vunachain.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': data.url,
    },
    ...(data.category && { articleSection: data.category }),
    ...(data.keywords && { keywords: data.keywords.join(', ') }),
  };

  return JSON.stringify(schema);
}

export function generateOrganizationSchema(): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vunachain',
    url: 'https://vunachain.com',
    logo: 'https://vunachain.com/logo.png',
    description:
      'Blockchain-verified traceability for EUDR compliance. Secure your agricultural supply chain.',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Sales',
      telephone: '+254-700-000-000',
      email: 'hello@vunachain.com',
    },
    sameAs: [
      'https://twitter.com/vunachain',
      'https://linkedin.com/company/vunachain',
    ],
  };

  return JSON.stringify(schema);
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return JSON.stringify(schema);
}

// Component to render JSON-LD in head
export const SchemaScript: React.FC<{ schema: string }> = ({ schema }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: schema }}
    />
  );
};
