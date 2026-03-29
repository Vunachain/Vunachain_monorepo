import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) =>
        Rule.required()
          .min(10)
          .max(60)
          .error('Title must be 10-60 characters for optimal SEO'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Meta Description / Excerpt',
      type: 'text',
      rows: 2,
      description: 'Used as meta description in search results and social sharing',
      validation: (Rule) =>
        Rule.required()
          .min(80)
          .max(160)
          .error('Meta description should be 80-160 characters'),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last Updated Date',
      type: 'datetime',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Fintech', value: 'fintech'},
          {title: 'Compliance', value: 'compliance'},
          {title: 'Agriculture', value: 'agriculture'},
          {title: 'Technology', value: 'technology'},
          {title: 'News', value: 'news'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords (1-5)',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
      validation: (Rule) =>
        Rule.max(5).error('Maximum 5 keywords for optimal SEO'),
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      description: 'Ideal size: 1200x630px (LinkedIn, Twitter, OpenGraph)',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          description: 'Critical for accessibility and SEO',
          validation: (Rule) => Rule.required().max(125),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content (Portable Text)',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading 2', value: 'h2'},
            {title: 'Heading 3', value: 'h3'},
            {title: 'Heading 4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'URL',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'markdownContent',
      title: 'Markdown Content (Auto-generated)',
      type: 'text',
      readOnly: true,
      description:
        'Automatically generated from Portable Text for /api/content/[slug].md endpoint. Used for LLM parsing.',
      rows: 15,
    }),
    defineField({
      name: 'relatedPosts',
      title: 'Related Posts',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'post'}]}],
      validation: (Rule) =>
        Rule.max(4).error('Maximum 4 related posts recommended'),
      description: 'Link 2-4 related posts for better user engagement',
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
      description: 'Only published posts appear in /blog and LLM endpoints',
    }),
    defineField({
      name: 'seoSettings',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        {
          name: 'robots',
          type: 'string',
          title: 'Robots Meta Tag',
          options: {
            list: [
              {title: 'Index, Follow', value: 'index, follow'},
              {title: 'No Index, No Follow', value: 'noindex, nofollow'},
              {title: 'Index, No Follow', value: 'index, nofollow'},
            ],
          },
          initialValue: 'index, follow',
        },
        {
          name: 'canonicalUrl',
          type: 'url',
          title: 'Canonical URL',
          description: 'For duplicate content management',
        },
        {
          name: 'ogImage',
          type: 'image',
          title: 'OpenGraph Image',
          description: 'Override featured image for social sharing',
          options: {
            hotspot: true,
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'featuredImage',
      author: 'author.name',
      date: 'publishedAt',
    },
    prepare: ({title, author, date, media}) => {
      return {
        title: title,
        subtitle: `By ${author || 'Unknown'} • ${
          date ? new Date(date).toLocaleDateString() : 'Not published'
        }`,
        media: media,
      }
    },
  },
})
