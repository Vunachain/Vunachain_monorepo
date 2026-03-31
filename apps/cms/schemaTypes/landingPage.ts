import { defineType, defineField, defineArrayMember } from 'sanity'

export default defineType({
    name: 'landingPage',
    title: 'Landing Page',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Page Template Title',
            type: 'string',
            description: 'Internal reference name',
        }),
        defineField({
            name: 'hero',
            title: 'Hero Section',
            type: 'object',
            fields: [
                { name: 'headline', title: 'Headline', type: 'string' },
                { name: 'subheadline', title: 'Subheadline', type: 'text' },
                { name: 'primaryButtonText', title: 'Primary Button Text', type: 'string' },
                { name: 'secondaryButtonText', title: 'Secondary Button Text', type: 'string' },
            ],
        }),
        defineField({
            name: 'problem',
            title: 'Problem Section',
            type: 'object',
            fields: [
                { name: 'title', title: 'Section Title', type: 'string' },
                { name: 'description', title: 'Section Description', type: 'string' },
                defineField({
                    name: 'painPoints',
                    title: 'Pain Points',
                    type: 'array',
                    of: [
                        defineArrayMember({
                            type: 'object',
                            fields: [
                                { name: 'title', type: 'string' },
                                { name: 'description', type: 'string' },
                                { name: 'icon', type: 'string', description: 'Material symbol name' },
                            ],
                        }),
                    ],
                }),
            ],
        }),
        defineField({
            name: 'seo',
            title: 'SEO Settings',
            type: 'object',
            fields: [
                defineField({ name: 'metaTitle', title: 'Meta Title', type: 'string', validation: (rule) => rule.max(60) }),
                defineField({ name: 'metaDescription', title: 'Meta Description', type: 'text', validation: (rule) => rule.max(160) }),
                { name: 'ogImage', title: 'Open Graph Image', type: 'image' },
            ],
        }),
    ],
    preview: {
        select: {
            title: 'title',
        },
    },
})
