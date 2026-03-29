// Vunachain_landing/lib/sanity.ts
// Sanity Client Configuration
// Connects to Sanity.io CMS for headless content delivery

import { createClient } from '@sanity/client';

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || '7iqshxb6';
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-02-03',
  useCdn: true, // Use CDN for faster reads
});

// Fetch all published posts (for blog listing page)
export async function getAllPosts() {
  return await sanityClient.fetch(
    `*[_type == "post" && isPublished == true] | order(publishedAt desc){
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      updatedAt,
      "author": author->name,
      category,
      keywords,
      "image": featuredImage.asset->url
    }`
  );
}

// Fetch single post by slug (for blog post page)
export async function getPostBySlug(slug: string) {
  return await sanityClient.fetch(
    `*[_type == "post" && slug.current == $slug && isPublished == true][0]{
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      updatedAt,
      "author": author->{name, bio, image},
      category,
      keywords,
      content,
      "image": featuredImage.asset->url,
      relatedPosts[]->{
        title,
        "slug": slug.current,
        "image": featuredImage.asset->url
      }
    }`,
    { slug }
  );
}

// Fetch posts by category
export async function getPostsByCategory(category: string) {
  return await sanityClient.fetch(
    `*[_type == "post" && category == $category && isPublished == true] | order(publishedAt desc){
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      "author": author->name,
      "image": featuredImage.asset->url
    }`,
    { category }
  );
}

// Fetch recent posts (for sidebar/recommendations)
export async function getRecentPosts(limit: number = 5) {
  return await sanityClient.fetch(
    `*[_type == "post" && isPublished == true] | order(publishedAt desc)[0..${limit - 1}]{
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      "image": featuredImage.asset->url
    }`
  );
}

// Fetch landing page content
export async function getLandingPageData() {
  return await sanityClient.fetch(
    `*[_type == "landingPage"][0]{
      hero,
      problem,
      seo
    }`
  );
}
