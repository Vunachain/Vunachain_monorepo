export default {
    name: 'landingPage',
    title: 'Landing Page',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Page Template Title',
            type: 'string',
            description: 'Internal reference name',
        },
        {
            name: 'hero',
            title: 'Hero Section',
            type: 'object',
            fields: [
                { name: 'headline', title: 'Headline', type: 'string' },
                { name: 'subheadline', title: 'Subheadline', type: 'text' },
                { name: 'primaryButtonText', title: 'Primary Button Text', type: 'string' },
                { name: 'secondaryButtonText', title: 'Secondary Button Text', type: 'string' },
            ],
        },
        {
            name: 'problem',
            title: 'Problem Section',
            type: 'object',
            fields: [
                { name: 'title', title: 'Section Title', type: 'string' },
                { name: 'description', title: 'Section Description', type: 'string' },
                {
                    name: 'painPoints',
                    title: 'Pain Points',
                    type: 'array',
                    of: [{
                        type: 'object', fields: [
                            { name: 'title', type: 'string' },
                            { name: 'description', type: 'string' },
                            { name: 'icon', type: 'string', description: 'Material symbol name' }
                        ]
                    }]
                }
            ]
        },
        {
            name: 'seo',
            title: 'SEO Settings',
            type: 'object',
            fields: [
                { name: 'metaTitle', title: 'Meta Title', type: 'string', validation: Rule => Rule.max(60) },
                { name: 'metaDescription', title: 'Meta Description', type: 'text', validation: Rule => Rule.max(160) },
                { name: 'ogImage', title: 'Open Graph Image', type: 'image' }
            ]
        }
    ],
    preview: {
        select: {
            title: 'title',
        },
    },
}
